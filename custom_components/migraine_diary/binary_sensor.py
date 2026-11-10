"""Binary migraine state, derived from the SQLite episode record."""
from __future__ import annotations

from datetime import timedelta

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

DOMAIN = "migraine_diary"
from .storage import DiaryStore

SIGNAL_EPISODE_CHANGED = "migraine_diary_episode_changed"
SCAN_INTERVAL = timedelta(seconds=30)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    store: DiaryStore = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([MigraineBinarySensor(store, entry.entry_id)], True)


class MigraineBinarySensor(BinarySensorEntity):
    """on = active episode; off = no active episode."""

    _attr_name = "Migren"
    _attr_has_entity_name = False
    _attr_icon = "mdi:head-flash"
    _attr_should_poll = True

    def __init__(self, store: DiaryStore, entry_id: str) -> None:
        self._store = store
        self._attr_unique_id = f"{entry_id}_migren"
        self._attr_is_on = False
        self._attr_extra_state_attributes = {}

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(async_dispatcher_connect(
            self.hass, SIGNAL_EPISODE_CHANGED, self._handle_change
        ))
        await self.async_update()
        self.async_write_ha_state()

    def _handle_change(self) -> None:
        self.hass.async_create_task(self._refresh())

    async def _refresh(self) -> None:
        await self.async_update()
        self.async_write_ha_state()

    async def async_update(self) -> None:
        active = await self._store.get_active_episode("patient")
        self._attr_is_on = active is not None
        self._attr_extra_state_attributes = (
            {"episode_id": active["id"], "started_at": active["started_at"]}
            if active else {}
        )
