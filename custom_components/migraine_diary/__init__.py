"""Migraine Diary integration (early scaffold)."""

from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry

DOMAIN = "migraine_diary"

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Initialize an entry; recording functionality is not implemented yet."""
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {}
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload an entry."""
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return True
