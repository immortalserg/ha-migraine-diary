"""Sensors exposing the current migraine episode to Home Assistant."""
from __future__ import annotations

from datetime import timedelta

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from .services import SIGNAL_RECORD_SAVED

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
    """Show the latest successfully committed event, without reading SQLite."""

    _attr_has_entity_name = False
    _attr_name = "Migraine diary last record"
    _attr_icon = "mdi:database-check"
    _attr_should_poll = False

    def __init__(self, store: DiaryStore, entry_id: str) -> None:
        self._attr_unique_id = f"{entry_id}_last_record"
        self.entity_id = "sensor.migraine_diary_last_record"
        self._attr_native_value = "Нет новых записей"
        self._attr_extra_state_attributes = {}

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(async_dispatcher_connect(
            self.hass, SIGNAL_RECORD_SAVED, self._on_saved
        ))

    def _on_saved(self, event: dict) -> None:
        kind = event["event_type"]
        payload = event["payload"]
        labels = {
            "pain": "Боль", "premonition": "Предчувствие",
            "medication": "Лекарство", "symptom": "Симптомы",
            "food": "Еда", "note": "Заметка",
            "activity": "Активность", "response": "Результат",
        }
        self._attr_native_value = labels.get(kind, kind)
        attrs = {
            "тип_записи": labels.get(kind, kind),
            "время_сохранения": event["saved_at"],
            "приступ": event.get("episode_id"),
            "id_записи": event["event_id"],
        }
        if kind == "pain":
            attrs.update({
                "интенсивность": payload.get("intensity"),
                "зоны_боли": payload.get("zones", []),
                "симптомы": payload.get("symptoms", []),
            })
        elif kind == "medication":
            attrs.update({
                "лекарство": payload.get("name"),
                "дозировка": payload.get("dose"),
                "единица": payload.get("unit"),
            })
        elif kind == "premonition":
            attrs["симптомы"] = payload.get("symptoms", [])
        else:
            attrs["данные"] = payload
        self._attr_extra_state_attributes = attrs
        self.async_write_ha_state()
