"""Sensors exposing the current migraine episode to Home Assistant."""
from __future__ import annotations

from datetime import timedelta

from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import DOMAIN
from .storage import DiaryStore

SCAN_INTERVAL = timedelta(seconds=30)
SYMPTOM_NAMES = [
    "Сильная ударная боль", "Пульсирующая боль",
    "Пульсирующая периодическая боль", "Усиливается при движении",
    "Тошнота", "Рвота", "Светочувствительность",
    "Чувствительность к шуму", "Боль в шее", "Головокружение",
    "Насморк", "Бессонница", "Подавленное настроение",
    "Тревожность", "Чувствительность к запахам",
    "Жар / ощущение жара", "Звон в ушах", "Усталость",
    "Расплывчатое зрение", "Перепады настроения",
]


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

    @property
    def device_info(self) -> DeviceInfo:
        return DeviceInfo(
            identifiers={("migraine_diary", self._entry_id)},
            name="Migraine Diary",
            manufacturer="Migraine Diary",
            model="Headache diary",
            configuration_url="https://github.com/immortalserg/ha-migraine-diary",
        )

    def __init__(self, store: DiaryStore, entry_id: str) -> None:
        self._store = store
        self._entry_id = entry_id
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

    @property
    def device_info(self) -> DeviceInfo:
        return DeviceInfo(
            identifiers={("migraine_diary", self._entry_id)},
            name="Migraine Diary",
            manufacturer="Migraine Diary",
            model="Headache diary",
            configuration_url="https://github.com/immortalserg/ha-migraine-diary",
        )

    def __init__(self, store: DiaryStore, entry_id: str) -> None:
        self._entry_id = entry_id
        self._attr_unique_id = f"{entry_id}_last_record"
        self.entity_id = "sensor.migraine_diary_last_record"
        self._attr_native_value = "Нет новых записей"
        self._attr_extra_state_attributes = {}

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.hass.data[DOMAIN]["last_record_sensor"] = self
        self.async_on_remove(self._unregister)

    def _unregister(self) -> None:
        if self.hass.data.get(DOMAIN, {}).get("last_record_sensor") is self:
            self.hass.data[DOMAIN].pop("last_record_sensor", None)

    def update_from_saved_event(self, event: dict) -> None:
        """Publish the exact data passed after a successful database operation."""
        kind = event["event_type"]
        payload = event.get("payload", {})
        labels = {
            "start": "Началась мигрень",
            "end": "Закончилась мигрень",
            "state_update": "Изменилось состояние",
            "pain": "Изменилось состояние",
            "medication": "Приём лекарства",
            "premonition": "Предчувствие",
        }
        label = labels.get(kind, kind)
        attrs = {
            "дата_и_время_записи": event["saved_at"],
            "событие": label,
        }
        if kind in ("start", "state_update", "pain"):
            attrs["уровень"] = payload.get("intensity")
            attrs["зоны"] = payload.get("zones", [])
            symptoms = payload.get("symptoms", [])
            # The card sends symptom names; normalize them to 1–20 for display.
            if symptoms and isinstance(symptoms[0], str):
                attrs["симптомы"] = [
                    SYMPTOM_NAMES.index(s) + 1 for s in symptoms
                    if s in SYMPTOM_NAMES
                ]
            else:
                attrs["симптомы"] = symptoms
        elif kind == "medication":
            attrs["лекарство"] = payload.get("name")
        parts = [label]
        if kind in ("start", "state_update", "pain"):
            parts.append(f"уровень: {attrs['уровень']}")
            parts.append("зоны: " + (", ".join(map(str, attrs["зоны"])) or "нет"))
            parts.append("симптомы: " + (", ".join(map(str, attrs["симптомы"])) or "нет"))
        elif kind == "medication":
            medicine = attrs.get("лекарство") or "не указано"
            dose = payload.get("dose")
            unit = payload.get("unit", "")
            if dose is not None:
                medicine += f" {dose:g}" if isinstance(dose, (int, float)) else f" {dose}"
                if unit:
                    medicine += f" {unit}"
            parts.append(medicine)

        # HA recorder limits entity state strings to 255 characters.
        state = " — ".join(parts)
        self._attr_native_value = state[:255]
        self._attr_extra_state_attributes = attrs
        self.async_write_ha_state()
