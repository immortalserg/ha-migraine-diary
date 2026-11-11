"""Migraine Diary integration setup and teardown."""
from __future__ import annotations

import sqlite3

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .history_api import MigraineHistoryView
from .services import register_services, unregister_services
from .storage import DiaryStore

DOMAIN = "migraine_diary"
PLATFORMS = ["sensor", "binary_sensor", "switch", "number"]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Initialize SQLite and register diary services."""
    if hass.data.get(DOMAIN):
        # One database/service handler per HA instance in this initial version.
        return False

    store = DiaryStore(hass.config.path("migraine_diary.db"))
    await store.initialize()
    try:
        await store.create_profile("Default", profile_id="patient")
    except sqlite3.IntegrityError:
        # A default profile already exists after a previous startup.
        pass

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = store
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    hass.http.register_view(MigraineHistoryView(store))
    register_services(hass, store)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Apply updated language options by reloading the integration."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the integration and unregister services."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        entry.async_unload_callbacks()
        unregister_services(hass)
        hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return unloaded
