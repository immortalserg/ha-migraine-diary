"""Migraine Diary integration setup and teardown."""
from __future__ import annotations

import sqlite3
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send
from .binary_sensor import SIGNAL_EPISODE_CHANGED

from .history_api import MigraineHistoryView
from .services import register_services, unregister_services
from .storage import DiaryStore

DOMAIN = "migraine_diary"
PLATFORMS = ["sensor", "binary_sensor", "switch", "number"]
FRONTEND_URL = "/migraine_diary/frontend"


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Expose bundled card and load its module without a manual Lovelace resource."""
    if hass.data.setdefault(DOMAIN, {}).get("frontend_registered"):
        return
    asset_dir = Path(__file__).parent / "frontend"
    await hass.http.async_register_static_paths([
        StaticPathConfig(FRONTEND_URL, str(asset_dir), cache_headers=False)
    ])
    frontend.add_extra_js_url(
        hass, f"{FRONTEND_URL}/migraine-diary-card.js"
    )
    hass.data[DOMAIN]["frontend_registered"] = True



async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Initialize SQLite and register diary services."""
    if any(isinstance(value, DiaryStore) for value in hass.data.get(DOMAIN, {}).values()):
        # Only reject a second active diary entry, not stale helper data.
        return False

    store = DiaryStore(hass.config.path("migraine_diary.db"))
    await store.initialize()
    try:
        await store.create_profile("Default", profile_id="patient")
    except sqlite3.IntegrityError:
        # A default profile already exists after a previous startup.
        pass

    await _async_register_frontend(hass)
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = store
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    hass.http.register_view(MigraineHistoryView(store))
    register_services(hass, store)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Update language-dependent entities without unloading the integration."""
    data = hass.data.get(DOMAIN, {})
    sensor = data.get("last_record_sensor")
    if sensor is not None and getattr(sensor, "_entry_id", None) == entry.entry_id:
        sensor._publish_event()
    async_dispatcher_send(hass, SIGNAL_EPISODE_CHANGED)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the integration and unregister services."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        entry.async_unload_callbacks()
        unregister_services(hass)
        data = hass.data.get(DOMAIN, {})
        data.pop(entry.entry_id, None)
        # Keep the frontend registration marker until restart.
    return unloaded
