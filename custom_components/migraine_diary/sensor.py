"""Sensors exposing the current migraine episode to Home Assistant."""
from __future__ import annotations

from datetime import timedelta

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from .binary_sensor import SIGNAL_EPISODE_CHANGED

from . import DOMAIN
from .storage import DiaryStore

SCAN_INTERVAL = timedelta(seconds=30)


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    store: DiaryStore = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([MigraineEpisodeSensor(store, entry.entry_id), MigraineLastRecordSensor(store, entry.entry_id)], True)


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

class MigraineLastRecordSensor(SensorEntity):
    """Readable view of the most recently committed SQLite event."""

    _attr_has_entity_name = False
    _attr_name = "Migraine diary last record"
    _attr_icon = "mdi:database-check"
    _attr_should_poll = True

    def __init__(self, store: DiaryStore, entry_id: str) -> None:
        self._store = store
        self._attr_unique_id = f"{entry_id}_last_record"
        self.entity_id = "sensor.migraine_diary_last_record"
        self._attr_native_value = "Нет записей"
        self._attr_extra_state_attributes = {}

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
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
        record = await self._store.get_last_record("patient")
        if record is None:
            self._attr_native_value = "Нет записей"
            self._attr_extra_state_attributes = {}
            return
        kind = record["event_type"]
        payload = record["payload"]
        labels = {
            "pain": "Боль", "premonition": "Предчувствие",
            "medication": "Лекарство", "symptom": "Симптомы",
            "food": "Еда", "note": "Заметка",
            "activity": "Активность", "response": "Результат",
        }
        self._attr_native_value = labels.get(kind, kind)
        attrs = {
            "тип_записи": labels.get(kind, kind),
            "время_события": record["occurred_at"],
            "время_сохранения": record["recorded_at"],
            "приступ": record["episode_id"],
            "id_записи": record["id"],
        }
        if kind == "pain":
            attrs["интенсивность"] = payload.get("intensity")
            attrs["зоны_боли"] = payload.get("zones", [])
            attrs["симптомы"] = payload.get("symptoms", [])
        elif kind == "medication":
            attrs["лекарство"] = payload.get("name")
            attrs["дозировка"] = payload.get("dose")
            attrs["единица"] = payload.get("unit")
        elif kind == "premonition":
            attrs["симптомы"] = payload.get("symptoms", [])
        else:
            attrs["данные"] = payload
        self._attr_extra_state_attributes = attrs
