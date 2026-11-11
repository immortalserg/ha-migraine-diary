"""SQLite persistence for Migraine Diary. No Home Assistant imports for testability."""
from __future__ import annotations

import asyncio
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _iso(value: str | None) -> str:
    if value is None:
        return utc_now()
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        raise ValueError("Timestamp must include a timezone")
    return dt.astimezone(timezone.utc).isoformat()


class DiaryStore:
    """Serializes writes; SQLite work runs off the HA event loop."""

    def __init__(self, db_path: str | Path) -> None:
        self.path = Path(db_path)
        self._lock = asyncio.Lock()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path, timeout=15)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA busy_timeout=15000")
        return conn

    def _run(self, callback):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            return callback(conn)

    async def initialize(self) -> None:
        async with self._lock:
            def op(conn):
                conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
                conn.execute(
                    "INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(1,?)",
                    (utc_now(),),
                )
            await asyncio.to_thread(self._run, op)

    async def create_profile(self, display_name: str, profile_id: str | None = None) -> str:
        profile_id = profile_id or str(uuid4())
        async with self._lock:
            def op(conn):
                conn.execute(
                    "INSERT INTO profiles(id,display_name,created_at) VALUES(?,?,?)",
                    (profile_id, display_name, utc_now()),
                )
            await asyncio.to_thread(self._run, op)
        return profile_id

    async def start_episode(
        self, profile_id: str, *, started_at: str | None = None,
        headache_type: str = "unspecified", notes: str | None = None
    ) -> str:
        episode_id = str(uuid4())
        started_at = _iso(started_at)
        async with self._lock:
            def op(conn):
                conflict = conn.execute(
                    """SELECT id FROM episodes WHERE profile_id=?
                       AND started_at<=? AND (ended_at IS NULL OR ended_at>?)
                       LIMIT 1""", (profile_id, started_at, started_at)
                ).fetchone()
                if conflict:
                    raise ValueError("Начало пересекается с существующим приступом")
                conn.execute(
                    "INSERT INTO episodes(id,profile_id,started_at,headache_type,notes) VALUES(?,?,?,?,?)",
                    (episode_id, profile_id, started_at, headache_type, notes),
                )
            await asyncio.to_thread(self._run, op)
        return episode_id

    async def ensure_active_episode(
        self, profile_id: str, *, started_at: str | None = None,
        headache_type: str = "unspecified", notes: str | None = None
    ) -> tuple[str, bool]:
        """Return the existing episode or create one atomically.

        A repeated start request never overwrites the original start time.
        """
        proposed_id = str(uuid4())
        started_at = _iso(started_at)
        if started_at > utc_now():
            raise ValueError("Начало не может быть в будущем")
        async with self._lock:
            def op(conn):
                existing = conn.execute(
                    "SELECT id FROM episodes WHERE profile_id=? AND ended_at IS NULL",
                    (profile_id,),
                ).fetchone()
                if existing is not None:
                    return existing["id"], False
                conflict = conn.execute(
                    """SELECT id FROM episodes WHERE profile_id=?
                       AND (ended_at IS NULL OR ended_at>?)
                       LIMIT 1""", (profile_id, started_at)
                ).fetchone()
                if conflict:
                    raise ValueError("Начало пересекается с существующим приступом")
                try:
                    conn.execute(
                        "INSERT INTO episodes(id,profile_id,started_at,headache_type,notes) VALUES(?,?,?,?,?)",
                        (proposed_id, profile_id, started_at, headache_type, notes),
                    )
                except sqlite3.IntegrityError:
                    # Do not mask missing profiles or unrelated integrity errors.
                    existing = conn.execute(
                        "SELECT id FROM episodes WHERE profile_id=? AND ended_at IS NULL",
                        (profile_id,),
                    ).fetchone()
                    if existing is None:
                        raise
                    return existing["id"], False
                return proposed_id, True
            return await asyncio.to_thread(self._run, op)

    async def end_episode(self, episode_id: str, *, ended_at: str | None = None) -> None:
        ended_at = _iso(ended_at)
        async with self._lock:
            def op(conn):
                current = conn.execute("SELECT profile_id,started_at FROM episodes WHERE id=? AND ended_at IS NULL",(episode_id,)).fetchone()
                if current is None or ended_at < current["started_at"]:
                    raise ValueError("Приступ не найден или окончание раньше начала")
                latest_event = conn.execute(
                    "SELECT MAX(occurred_at) AS latest FROM events WHERE episode_id=?",
                    (episode_id,),
                ).fetchone()["latest"]
                if latest_event is not None and ended_at < latest_event:
                    raise ValueError("Окончание раньше последней записи этого приступа")
                conflict = conn.execute(
                    """SELECT id FROM episodes WHERE profile_id=? AND id<>?
                       AND started_at<? AND (ended_at IS NULL OR ended_at>?)
                       LIMIT 1""",
                    (current["profile_id"], episode_id, ended_at, current["started_at"]),
                ).fetchone()
                if conflict:
                    raise ValueError("Окончание пересекается с другим приступом")
                cursor = conn.execute(
                    "UPDATE episodes SET ended_at=? WHERE id=? AND ended_at IS NULL AND started_at<=?",
                    (ended_at, episode_id, ended_at),
                )
                if cursor.rowcount != 1:
                    raise ValueError("Episode not active, not found, or end before start")
            await asyncio.to_thread(self._run, op)

    async def correct_active_start(self, profile_id: str, started_at: str) -> str:
        """Move the active episode start earlier, without overlapping another episode."""
        start = _iso(started_at)
        if start > utc_now():
            raise ValueError("Начало не может быть в будущем")
        async with self._lock:
            def op(conn):
                active = conn.execute(
                    "SELECT id,started_at FROM episodes WHERE profile_id=? AND ended_at IS NULL",
                    (profile_id,),
                ).fetchone()
                if active is None:
                    raise ValueError("Нет активного приступа для исправления начала")
                if start > active["started_at"]:
                    raise ValueError("Исправленное начало должно быть не позже записанного")
                conflict = conn.execute(
                    """SELECT id FROM episodes WHERE profile_id=? AND id<>?
                       AND started_at<? AND (ended_at IS NULL OR ended_at>?)
                       LIMIT 1""",
                    (profile_id, active["id"], active["started_at"], start),
                ).fetchone()
                if conflict:
                    raise ValueError("Исправленное начало пересекается с предыдущим приступом")
                conn.execute("UPDATE episodes SET started_at=? WHERE id=?", (start, active["id"]))
                return active["id"]
            return await asyncio.to_thread(self._run, op)

    async def create_past_episode(self, profile_id: str, started_at: str, ended_at: str, *, pain: dict | None = None) -> str:
        """Atomically add an already completed episode without changing active state."""
        start = _iso(started_at)
        end = _iso(ended_at)
        if start >= end:
            raise ValueError("End must be after start")
        if end > utc_now():
            raise ValueError("Past episode cannot end in the future")
        if pain is not None:
            intensity = pain.get("intensity")
            zones = pain.get("zones")
            symptoms = pain.get("symptoms", [])
            if type(intensity) is not int or not 1 <= intensity <= 9:
                raise ValueError("Pain intensity must be an integer from 1 to 9")
            if not isinstance(zones, list) or any(type(z) is not int or not 1 <= z <= 19 for z in zones):
                raise ValueError("Pain zones must be a list of zone numbers 1–19")
            if not isinstance(symptoms, list) or any(type(v) not in (str, int) for v in symptoms):
                raise ValueError("Symptoms must be a list")
        episode_id = str(uuid4())
        async with self._lock:
            def op(conn):
                # Intervals are half-open: [start, end). Touching endpoints
                # are permitted, but any positive-duration overlap is rejected.
                # NULL ended_at represents an active, open-ended episode.
                conflict = conn.execute(
                    """SELECT id, started_at, ended_at FROM episodes
                       WHERE profile_id=?
                         AND started_at < ?
                         AND (ended_at IS NULL OR ended_at > ?)
                       ORDER BY started_at LIMIT 1""",
                    (profile_id, end, start),
                ).fetchone()
                if conflict is not None:
                    raise ValueError(
                        "Приступ пересекается с существующим: "
                        f"{conflict['started_at']} — {conflict['ended_at'] or 'активен'}"
                    )
                conn.execute(
                    "INSERT INTO episodes(id,profile_id,started_at,ended_at,headache_type) "
                    "VALUES(?,?,?,?,?)",
                    (episode_id, profile_id, start, end, "unspecified"),
                )
                if pain is not None:
                    conn.execute(
                        "INSERT INTO events(id,profile_id,episode_id,event_type,occurred_at,recorded_at,payload_json) VALUES(?,?,?,?,?,?,?)",
                        (str(uuid4()), profile_id, episode_id, "pain", start, utc_now(), json.dumps(pain, ensure_ascii=False)),
                    )
            await asyncio.to_thread(self._run, op)
        return episode_id

    async def record_event(
        self, profile_id: str, event_type: str, payload: dict,
        *, episode_id: str | None = None, occurred_at: str | None = None
    ) -> str:
        if event_type not in {"premonition", "symptom", "pain", "medication", "food", "note", "activity", "response"}:
            raise ValueError("Unknown event type")
        if not isinstance(payload, dict):
            raise ValueError("Payload must be an object")
        if event_type == "pain":
            intensity = payload.get("intensity")
            zones = payload.get("zones")
            if not isinstance(intensity, int) or isinstance(intensity, bool) or not 1 <= intensity <= 9:
                raise ValueError("Pain intensity must be an integer from 1 to 9")
            if not isinstance(zones, list) or any(not isinstance(z, int) or isinstance(z, bool) or z < 1 or z > 19 for z in zones):
                raise ValueError("Pain zones must be a list of zone numbers 1–19")
        event_id = str(uuid4())
        occurred_at = _iso(occurred_at)
        recorded_at = utc_now()
        serialized = json.dumps(payload, ensure_ascii=False)
        async with self._lock:
            def op(conn):
                if episode_id is not None:
                    episode = conn.execute(
                        "SELECT profile_id FROM episodes WHERE id=?", (episode_id,)
                    ).fetchone()
                    if episode is None or episode["profile_id"] != profile_id:
                        raise ValueError("Episode does not belong to profile")
                conn.execute(
                    "INSERT INTO events(id,profile_id,episode_id,event_type,occurred_at,recorded_at,payload_json) VALUES(?,?,?,?,?,?,?)",
                    (event_id, profile_id, episode_id, event_type, occurred_at, recorded_at, serialized),
                )
            await asyncio.to_thread(self._run, op)
        return event_id

    async def update_food(self, profile_id: str, event_id: str, *, name: str,
                          quantity: str = "", notes: str = "",
                          occurred_at: str | None = None) -> None:
        """Update only a food event belonging to the requested profile."""
        name = name.strip()
        if not name or len(name) > 200:
            raise ValueError("Food name must contain 1–200 characters")
        if len(quantity) > 100 or len(notes) > 500:
            raise ValueError("Food quantity or notes exceed allowed length")
        timestamp = _iso(occurred_at) if occurred_at is not None else None
        async with self._lock:
            def op(conn):
                row = conn.execute(
                    "SELECT occurred_at FROM events WHERE id=? AND profile_id=? AND event_type='food'",
                    (event_id, profile_id),
                ).fetchone()
                if row is None:
                    raise ValueError("Food record not found for profile")
                conn.execute(
                    "UPDATE events SET occurred_at=?, payload_json=? WHERE id=? AND profile_id=? AND event_type='food'",
                    (timestamp or row["occurred_at"],
                     json.dumps({"name": name, "quantity": quantity.strip(), "notes": notes.strip()}, ensure_ascii=False),
                     event_id, profile_id),
                )
            await asyncio.to_thread(self._run, op)

    async def delete_food(self, profile_id: str, event_id: str) -> None:
        """Delete a food event without affecting migraine events or other profiles."""
        async with self._lock:
            def op(conn):
                cursor = conn.execute(
                    "DELETE FROM events WHERE id=? AND profile_id=? AND event_type='food'",
                    (event_id, profile_id),
                )
                if cursor.rowcount != 1:
                    raise ValueError("Food record not found for profile")
            await asyncio.to_thread(self._run, op)

    async def get_latest_pain(self, profile_id: str) -> dict | None:
        """Latest saved pain assessment for the currently active episode."""
        def op(conn):
            row = conn.execute(
                """SELECT e.payload_json, e.occurred_at
                   FROM events e JOIN episodes ep ON ep.id=e.episode_id
                   WHERE e.profile_id=? AND e.event_type='pain'
                     AND ep.profile_id=? AND ep.ended_at IS NULL
                   ORDER BY e.occurred_at DESC, e.recorded_at DESC LIMIT 1""",
                (profile_id, profile_id),
            ).fetchone()
            if row is None:
                return None
            return {"occurred_at": row["occurred_at"], **json.loads(row["payload_json"])}
        return await asyncio.to_thread(self._run, op)

    async def get_active_episode(self, profile_id: str) -> dict | None:
        def op(conn):
            row = conn.execute(
                "SELECT * FROM episodes WHERE profile_id=? AND ended_at IS NULL", (profile_id,)
            ).fetchone()
            return dict(row) if row else None
        return await asyncio.to_thread(self._run, op)

    async def list_episodes(self, profile_id: str, limit: int = 100) -> list[dict]:
        if not 1 <= limit <= 1000:
            raise ValueError("limit out of range")
        def op(conn):
            return [dict(row) for row in conn.execute(
                "SELECT * FROM episodes WHERE profile_id=? ORDER BY started_at DESC LIMIT ?",
                (profile_id, limit),
            )]
        return await asyncio.to_thread(self._run, op)

    async def list_history(
        self, profile_id: str, *, limit: int = 200,
        start: str | None = None, end: str | None = None
    ) -> list[dict]:
        """Read a bounded timeline of episodes and events, newest first."""
        if not 1 <= limit <= 1000:
            raise ValueError("History limit must be between 1 and 1000")
        start_at = _iso(start) if start else None
        end_at = _iso(end) if end else None
        if start_at and end_at and start_at > end_at:
            raise ValueError("History start must not exceed end")

        def op(conn):
            # Combine the episode lifecycle with the event stream.
            # The episode timestamps are authoritative for start/end.
            where_events = ["profile_id=?"]
            where_start = ["profile_id=?"]
            where_end = ["profile_id=?", "ended_at IS NOT NULL"]
            event_args = [profile_id]
            start_args = [profile_id]
            end_args = [profile_id]
            for boundary, operator in ((start_at, ">="), (end_at, "<=")):
                if boundary:
                    where_events.append(f"occurred_at{operator}?")
                    where_start.append(f"started_at{operator}?")
                    where_end.append(f"ended_at{operator}?")
                    event_args.append(boundary)
                    start_args.append(boundary)
                    end_args.append(boundary)
            query = (
                "SELECT id,episode_id,event_type AS event,occurred_at AS date,"
                "payload_json,recorded_at FROM events WHERE " + " AND ".join(where_events)
                + " UNION ALL SELECT 'start:' || id,id,'start',started_at,'{}',started_at"
                " FROM episodes WHERE " + " AND ".join(where_start)
                + " UNION ALL SELECT 'end:' || id,id,'end',ended_at,'{}',ended_at"
                " FROM episodes WHERE " + " AND ".join(where_end)
                + " ORDER BY date DESC,recorded_at DESC LIMIT ?"
            )
            results = conn.execute(
                query, (*event_args, *start_args, *end_args, limit)
            ).fetchall()
            symptom_names = [
                "Сильная ударная боль", "Пульсирующая боль",
                "Пульсирующая периодическая боль", "Усиливается при движении",
                "Тошнота", "Рвота", "Светочувствительность",
                "Чувствительность к шуму", "Боль в шее", "Головокружение",
                "Насморк", "Бессонница", "Подавленное настроение",
                "Тревожность", "Чувствительность к запахам",
                "Жар / ощущение жара", "Звон в ушах", "Усталость",
                "Расплывчатое зрение", "Перепады настроения",
            ]
            rows = []
            for item in results:
                payload = json.loads(item["payload_json"])
                symptoms = payload.get("symptoms", [])
                normalized = []
                for symptom in symptoms:
                    if isinstance(symptom, int) and 1 <= symptom <= 20:
                        normalized.append(symptom)
                    elif isinstance(symptom, str) and symptom in symptom_names:
                        normalized.append(symptom_names.index(symptom) + 1)
                    else:
                        normalized.append(str(symptom))
                rows.append({
                    "id": item["id"], "episode_id": item["episode_id"],
                    "date": item["date"], "event": item["event"],
                    "level": payload.get("intensity"),
                    "zones": ", ".join(map(str, payload.get("zones", []))),
                    "symptoms": ", ".join(map(str, normalized)),
                    "medication": payload.get("name", "") if item["event"] == "medication" else "",
                    "food": payload.get("name", "") if item["event"] == "food" else "",
                    "quantity": payload.get("quantity", ""),
                    "notes": payload.get("notes", ""),
                    "dose": payload.get("dose"),
                    "unit": payload.get("unit", ""),
                })
            return rows

        return await asyncio.to_thread(self._run, op)
