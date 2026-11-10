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
        async with self._lock:
            def op(conn):
                existing = conn.execute(
                    "SELECT id FROM episodes WHERE profile_id=? AND ended_at IS NULL",
                    (profile_id,),
                ).fetchone()
                if existing is not None:
                    return existing["id"], False
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
                cursor = conn.execute(
                    "UPDATE episodes SET ended_at=? WHERE id=? AND ended_at IS NULL AND started_at<=?",
                    (ended_at, episode_id, ended_at),
                )
                if cursor.rowcount != 1:
                    raise ValueError("Episode not active, not found, or end before start")
            await asyncio.to_thread(self._run, op)

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
