"""Home Assistant service handlers for Migraine Diary."""
from __future__ import annotations

import logging
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
SERVICE_NAMES = ("start_episode", "end_episode", "record_premonition", "record_medication", "record_pain")

PROFILE = vol.Required("profile_id")
TIMESTAMP = vol.Optional("occurred_at")
EPISODE = vol.Optional("episode_id")

SCHEMAS = {
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
                               vol.Required("zones"): [vol.All(vol.Coerce(int), vol.Range(min=1, max=19))]}),
}


def register_services(hass: HomeAssistant, store: DiaryStore) -> None:
    """Register services once, for the active single-entry integration."""

    async def handle(call: ServiceCall) -> dict:
        name = call.service
        data = dict(call.data)
        profile_id = data.pop("profile_id")
        try:
            if name == "start_episode":
                episode_id = await store.start_episode(
                    profile_id, started_at=data.get("started_at"),
                    headache_type=data.get("headache_type", "unspecified"),
                    notes=data.get("notes"),
                )
                async_dispatcher_send(hass, SIGNAL_EPISODE_CHANGED)
                return {"episode_id": episode_id}
            if name == "end_episode":
                requested_id = data.get("episode_id")
                active = await store.get_active_episode(profile_id)
                if active is None:
                    raise ValueError(f"No active episode for profile {profile_id!r}")
                if requested_id is not None and requested_id != active["id"]:
                    raise ValueError("Requested episode does not match active episode for profile")
                await store.end_episode(active["id"], ended_at=data.get("ended_at"))
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
                payload = {"intensity": data["intensity"], "zones": data["zones"]}
            else:
                raise ValueError("Unsupported service")
            event_id = await store.record_event(
                profile_id, name.removeprefix("record_"), payload,
                episode_id=episode_id, occurred_at=occurred_at,
            )
            return {"event_id": event_id}
        except (ValueError, sqlite3.IntegrityError) as err:
            raise HomeAssistantError(str(err)) from err

    for name in SERVICE_NAMES:
        hass.services.async_register(
            DOMAIN, name, handle,
            schema=SCHEMAS[name],
            supports_response=SupportsResponse.OPTIONAL,
        )


def unregister_services(hass: HomeAssistant) -> None:
    for name in SERVICE_NAMES:
        hass.services.async_remove(DOMAIN, name)
