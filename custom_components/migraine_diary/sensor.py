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
    _attr_translation_key = "active_episode"
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

LAST_RECORD_TEXT = {
  "ru": [
    "Нет новых записей",
    "Началась мигрень",
    "Закончилась мигрень",
    "Изменилось состояние",
    "Приём лекарства",
    "Предчувствие",
    "уровень",
    "зоны",
    "симптомы",
    "нет",
    "не указано"
  ],
  "en": [
    "No recent records",
    "Migraine started",
    "Migraine ended",
    "State updated",
    "Medication taken",
    "Premonition",
    "level",
    "zones",
    "symptoms",
    "none",
    "not specified"
  ],
  "fr": [
    "Aucune nouvelle entrée",
    "Début de la migraine",
    "Fin de la migraine",
    "État mis à jour",
    "Prise de médicament",
    "Signes précurseurs",
    "intensité",
    "zones",
    "symptômes",
    "aucun",
    "non précisé"
  ],
  "de": [
    "Keine neuen Einträge",
    "Migräne begonnen",
    "Migräne beendet",
    "Zustand aktualisiert",
    "Medikament eingenommen",
    "Vorboten",
    "Stärke",
    "Zonen",
    "Symptome",
    "keine",
    "nicht angegeben"
  ],
  "it": [
    "Nessuna nuova registrazione",
    "Emicrania iniziata",
    "Emicrania terminata",
    "Stato aggiornato",
    "Farmaco assunto",
    "Sintomi premonitori",
    "intensità",
    "zone",
    "sintomi",
    "nessuno",
    "non specificato"
  ],
  "lu": [
    "Keng nei Andrag",
    "Migrän huet ugefaangen",
    "Migrän ass eriwwer",
    "Zoustand aktualiséiert",
    "Medikament geholl",
    "Virzeechen",
    "Intensitéit",
    "Zonen",
    "Symptomer",
    "keng",
    "net uginn"
  ]
}

class MigraineLastRecordSensor(SensorEntity):
    """Show the latest successfully committed event, without reading SQLite."""

    _attr_has_entity_name = False
    _attr_translation_key = "last_record"
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
        self._attr_native_value = "No recent records"
        self._last_event = None
        self._attr_extra_state_attributes = {}

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.hass.data[DOMAIN]["last_record_sensor"] = self
        self._publish_event()
        self.async_on_remove(self._unregister)

    def _unregister(self) -> None:
        if self.hass.data.get(DOMAIN, {}).get("last_record_sensor") is self:
            self.hass.data[DOMAIN].pop("last_record_sensor", None)

    def _language(self) -> str:
        language = (self.hass.config.language or "en").split("-")[0].lower()
        return "lu" if language == "lb" else language if language in LAST_RECORD_TEXT else "en"

    def _publish_event(self) -> None:
        event = self._last_event
        lang = self._language()
        words = LAST_RECORD_TEXT[lang]
        if event is None:
            self._attr_native_value = words[0]
            self._attr_extra_state_attributes = {}
            self.async_write_ha_state()
            return
        kind = event["event_type"]
        payload = event.get("payload", {})
        labels = {"start": words[1], "end": words[2], "state_update": words[3],
                  "pain": words[3], "medication": words[4], "premonition": words[5]}
        label = labels.get(kind, kind)
        attrs = {"recorded_at": event["saved_at"], "event_type": kind, "event_label": label}
        parts = [label]
        if kind in ("start", "state_update", "pain"):
            level = payload.get("intensity")
            zones = payload.get("zones", [])
            symptoms = payload.get("symptoms", [])
            if symptoms and isinstance(symptoms[0], str):
                symptoms = [SYMPTOM_NAMES.index(s) + 1 for s in symptoms if s in SYMPTOM_NAMES]
            attrs.update({"intensity": level, "zones": zones, "symptoms": symptoms})
            parts.extend([f"{words[6]}: {level}",
                          f"{words[7]}: {', '.join(map(str, zones)) or words[9]}",
                          f"{words[8]}: {', '.join(map(str, symptoms)) or words[9]}"])
        elif kind == "medication":
            medicine = payload.get("name") or words[10]
            attrs["medication"] = payload.get("name")
            dose = payload.get("dose")
            unit = payload.get("unit", "")
            if dose is not None:
                medicine += f" {dose:g}" if isinstance(dose, (int, float)) else f" {dose}"
                if unit:
                    medicine += f" {unit}"
            parts.append(medicine)
        self._attr_native_value = " — ".join(parts)[:255]
        self._attr_extra_state_attributes = attrs
        self.async_write_ha_state()

    def update_from_saved_event(self, event: dict) -> None:
        """Keep language-neutral event data and render a localized summary."""
        self._last_event = dict(event)
        self._publish_event()
