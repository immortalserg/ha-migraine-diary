"""Sensors exposing the current migraine episode to Home Assistant."""
from __future__ import annotations

from datetime import timedelta

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import DOMAIN
from .storage import DiaryStore

SCAN_INTERVAL = timedelta(seconds=30)


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    store: DiaryStore = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([MigraineEpisodeSensor(store, entry.entry_id)], True)


class MigraineEpisodeSensor(SensorEntity):
    """Show active episode ID, or 'none' when no episode is active."""

    _attr_has_entity_name = True
    _attr_name = "Active episode"
    _attr_icon = "mdi:head-flash"

    def __init__(self, store: DiaryStore, entry_id: str) -> None:
        self._store = store
        self._attr_unique_id = f"{entry_id}_active_episode"
        self._attr_native_value = "none"
        self._attr_extra_state_attributes = {}

    async def async_update(self) -> None:
        active = await self._store.get_active_episode("patient")
        if active is None:
            self._attr_native_value = "none"
            self._attr_extra_state_attributes = {"active": False}
        else:
            self._attr_native_value = active["id"]
            self._attr_extra_state_attributes = {
                "active": True,
                "started_at": active["started_at"],
                "headache_type": active["headache_type"],
            }
