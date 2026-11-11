"""Home Assistant service handlers for Migraine Diary."""
from __future__ import annotations

import csv
import io
import logging
from datetime import datetime, timezone
import sqlite3

import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.dispatcher import async_dispatcher_send
from .binary_sensor import SIGNAL_EPISODE_CHANGED

from .storage import DiaryStore

_LOGGER = logging.getLogger(__name__)
DOMAIN = "migraine_diary"
SIGNAL_RECORD_SAVED = "migraine_diary_record_saved"

def _notify_record_saved(hass: HomeAssistant, event: dict) -> None:
    """Update the registered sensor immediately after successful persistence."""
    sensor = hass.data.get(DOMAIN, {}).get("last_record_sensor")
    if sensor is not None:
        sensor.update_from_saved_event(event)
    else:
        _LOGGER.warning("Last-record sensor not registered for saved event %s", event["event_id"])

SERVICE_NAMES = ("start_episode", "end_episode", "record_past_episode", "correct_active_start", "record_premonition", "record_medication", "record_pain", "list_history", "export_csv")

PROFILE = vol.Required("profile_id")
TIMESTAMP = vol.Optional("occurred_at")
EPISODE = vol.Optional("episode_id")

SCHEMAS = {
    "export_csv": vol.Schema({PROFILE: cv.string, vol.Optional("limit", default=1000): vol.All(vol.Coerce(int), vol.Range(min=1, max=1000)), vol.Optional("start"): cv.string, vol.Optional("end"): cv.string}),
    "list_history": vol.Schema({PROFILE: cv.string, vol.Optional("limit", default=200): vol.All(vol.Coerce(int), vol.Range(min=1, max=1000)), vol.Optional("start"): cv.string, vol.Optional("end"): cv.string}),
    "correct_active_start": vol.Schema({PROFILE: cv.string, vol.Required("started_at"): cv.string}),
    "record_past_episode": vol.Schema({PROFILE: cv.string, vol.Required("started_at"): cv.string, vol.Required("ended_at"): cv.string}),
    "start_episode": vol.Schema({PROFILE: cv.string, vol.Optional("started_at"): cv.string,
                                  vol.Optional("headache_type", default="unspecified"): cv.string,
                                  vol.Optional("notes"): cv.string}),
    "end_episode": vol.Schema({PROFILE: cv.string, EPISODE: cv.string, vol.Optional("ended_at"): cv.string}),
    "record_premonition": vol.Schema({PROFILE: cv.string, TIMESTAMP: cv.string,
                                      vol.Optional("symptoms", default=list): [cv.string]}),
    "record_medication": vol.Schema({PROFILE: cv.string, TIMESTAMP: cv.string,
                                     EPISODE: cv.string, vol.Required("name"): cv.string,
                                     vol.Optional("dose"): vol.Coerce(float),
                                     vol.Optional("unit"): cv.string}),
    "record_pain": vol.Schema({PROFILE: cv.string, TIMESTAMP: cv.string,
                               EPISODE: cv.string,
                               vol.Required("intensity"): vol.All(vol.Coerce(int), vol.Range(min=1, max=9)),
                               vol.Required("zones"): [vol.All(vol.Coerce(int), vol.Range(min=1, max=19))],
                               vol.Optional("symptoms", default=list): [cv.string]}),
}


def _current_state(hass: HomeAssistant) -> dict:
    """Snapshot integration-owned entities at the moment of recording."""
    level = hass.states.get("number.migraine_level")
    try:
        intensity = int(float(level.state)) if level else 5
    except (ValueError, TypeError):
        intensity = 5
    if not 1 <= intensity <= 9:
        intensity = 5
    return {
        "intensity": intensity,
        "zones": [i for i in range(1, 20) if (s := hass.states.get(f"switch.migraine_zone_{i}")) is not None and s.state == "on"],
        "symptoms": [i for i in range(1, 21) if (s := hass.states.get(f"switch.migrene_sypptome{i}")) is not None and s.state == "on"],
    }


def register_services(hass: HomeAssistant, store: DiaryStore) -> None:
    """Register services once, for the active single-entry integration."""

    async def handle(call: ServiceCall) -> dict:
        name = call.service
        data = dict(call.data)
        profile_id = data.pop("profile_id")
        try:
            if name in ("list_history", "export_csv"):
                records = await store.list_history(
                    profile_id, limit=data.get("limit", 200),
                    start=data.get("start"), end=data.get("end"),
                )
                if name == "list_history":
                    return {"records": records}
                buffer = io.StringIO()
                columns = ["date", "event", "level", "zones", "symptoms", "medication", "dose", "unit", "episode_id", "id"]
                writer = csv.DictWriter(buffer, fieldnames=columns, extrasaction="ignore", delimiter=";")
                writer.writeheader()
                writer.writerows(records)
                return {"filename": "migraine-diary.csv", "csv": buffer.getvalue(), "count": len(records)}
            if name == "correct_active_start":
                episode_id = await store.correct_active_start(profile_id, data["started_at"])
                async_dispatcher_send(hass, SIGNAL_EPISODE_CHANGED)
                return {"episode_id": episode_id}
            if name == "record_past_episode":
                episode_id = await store.create_past_episode(profile_id, data["started_at"], data["ended_at"])
                return {"episode_id": episode_id}
            if name == "start_episode":
                episode_id, created = await store.ensure_active_episode(
                    profile_id, started_at=data.get("started_at"),
                    headache_type=data.get("headache_type", "unspecified"),
                    notes=data.get("notes"),
                )
                if created:
                    snapshot = _current_state(hass)
                    event_id = await store.record_event(profile_id, "pain", snapshot, episode_id=episode_id)
                    _notify_record_saved(hass, {
                        "event_id": event_id, "episode_id": episode_id,
                        "event_type": "start", "payload": snapshot,
                        "saved_at": datetime.now(timezone.utc).isoformat(),
                    })
                async_dispatcher_send(hass, SIGNAL_EPISODE_CHANGED)
                return {"episode_id": episode_id, "created": created}
            if name == "end_episode":
                requested_id = data.get("episode_id")
                active = await store.get_active_episode(profile_id)
                if active is None:
                    raise ValueError(f"No active episode for profile {profile_id!r}")
                if requested_id is not None and requested_id != active["id"]:
                    raise ValueError("Requested episode does not match active episode for profile")
                await store.end_episode(active["id"], ended_at=data.get("ended_at"))
                _notify_record_saved(hass, {
                    "event_id": active["id"], "episode_id": active["id"],
                    "event_type": "end", "payload": {},
                    "saved_at": datetime.now(timezone.utc).isoformat(),
                })
                async_dispatcher_send(hass, SIGNAL_EPISODE_CHANGED)
                return {"episode_id": active["id"]}
            active = await store.get_active_episode(profile_id)
            episode_id = data.pop("episode_id", None)
            occurred_at = data.pop("occurred_at", None)
            if episode_id is None and active is not None:
                episode_id = active["id"]
            if name == "record_premonition":
                # Premonitions may precede any active episode.
                episode_id = None
                payload = {"symptoms": data.get("symptoms", [])}
            elif name == "record_medication":
                payload = {k: data[k] for k in ("name", "dose", "unit") if k in data}
            elif name == "record_pain":
                if episode_id is None:
                    raise ValueError("Pain recording requires an active episode")
                payload = {"intensity": data["intensity"], "zones": data["zones"], "symptoms": data.get("symptoms", [])}
            else:
                raise ValueError("Unsupported service")
            event_id = await store.record_event(
                profile_id, name.removeprefix("record_"), payload,
                episode_id=episode_id, occurred_at=occurred_at,
            )
            _notify_record_saved(hass, {
                "event_id": event_id,
                "episode_id": episode_id,
                "event_type": "state_update" if name == "record_pain" else name.removeprefix("record_"),
                "payload": payload,
                "saved_at": datetime.now(timezone.utc).isoformat(),
            })
            if name == "record_pain":
                async_dispatcher_send(hass, SIGNAL_EPISODE_CHANGED)
            return {"event_id": event_id}
        except (ValueError, sqlite3.IntegrityError) as err:
            raise HomeAssistantError(str(err)) from err

    for name in SERVICE_NAMES:
        hass.services.async_register(
            DOMAIN, name, handle,
            schema=SCHEMAS[name],
            supports_response=SupportsResponse.ONLY if name in ("list_history", "export_csv") else SupportsResponse.OPTIONAL,
        )


def unregister_services(hass: HomeAssistant) -> None:
    for name in SERVICE_NAMES:
        hass.services.async_remove(DOMAIN, name)
