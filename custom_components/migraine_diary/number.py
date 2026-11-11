"""Migraine pain level, persisted using Home Assistant state restoration."""
from homeassistant.components.number import NumberEntity
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.restore_state import RestoreEntity

async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([MigraineLevel(entry.entry_id)])

class MigraineLevel(NumberEntity, RestoreEntity):
    _attr_has_entity_name = True
    _attr_translation_key = "migraine_level"
    _attr_icon = "mdi:head-flash"
    _attr_native_min_value = 1
    _attr_native_max_value = 9
    _attr_native_step = 1
    _attr_mode = "slider"

    @property
    def device_info(self) -> DeviceInfo:
        return DeviceInfo(
            identifiers={("migraine_diary", self._entry_id)},
            name="Migraine Diary",
            manufacturer="Migraine Diary",
            model="Headache diary",
            configuration_url="https://github.com/immortalserg/ha-migraine-diary",
        )

    def __init__(self, entry_id):
        self._entry_id = entry_id
        self._attr_unique_id = f"{entry_id}_migraine_level"
        self.entity_id = "number.migraine_level"
        self._attr_native_value = 5

    async def async_added_to_hass(self):
        await super().async_added_to_hass()
        previous = await self.async_get_last_state()
        if previous is not None:
            try:
                value = int(float(previous.state))
                if 1 <= value <= 9:
                    self._attr_native_value = value
            except (TypeError, ValueError):
                pass
        self.async_write_ha_state()

    async def async_set_native_value(self, value):
        self._attr_native_value = int(value)
        self.async_write_ha_state()
