"""Migraine diary owned switches: 19 zones and 20 symptoms."""
from homeassistant.components.switch import SwitchEntity
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.restore_state import RestoreEntity

DOMAIN = "migraine_diary"
SYMPTOMS = [
    "Сильная ударная боль", "Пульсирующая боль",
    "Пульсирующая периодическая боль", "Усиливается при движении",
    "Тошнота", "Рвота", "Светочувствительность",
    "Чувствительность к шуму", "Боль в шее", "Головокружение",
    "Насморк", "Бессонница", "Подавленное настроение",
    "Тревожность", "Чувствительность к запахам",
    "Жар / ощущение жара", "Звон в ушах", "Усталость",
    "Расплывчатое зрение", "Перепады настроения",
]

async def async_setup_entry(hass, entry, async_add_entities):
    entities = [
        DiaryToggle(entry.entry_id, f"migraine_zone_{i}", f"Migraine zone {i}")
        for i in range(1, 20)
    ]
    entities.extend(
        DiaryToggle(entry.entry_id, f"migrene_sypptome{i}", label)
        for i, label in enumerate(SYMPTOMS, 1)
    )
    async_add_entities(entities)

class DiaryToggle(SwitchEntity, RestoreEntity):
    _attr_has_entity_name = False
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

    def __init__(self, entry_id, slug, label):
        self._entry_id = entry_id
        self._attr_unique_id = f"{entry_id}_{slug}"
        self.entity_id = f"switch.{slug}"
        self._attr_name = label
        self._attr_is_on = False

    async def async_added_to_hass(self):
        await super().async_added_to_hass()
        previous = await self.async_get_last_state()
        if previous is not None:
            self._attr_is_on = previous.state == "on"
        self.async_write_ha_state()

    async def async_turn_on(self, **kwargs):
        self._attr_is_on = True
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs):
        self._attr_is_on = False
        self.async_write_ha_state()
