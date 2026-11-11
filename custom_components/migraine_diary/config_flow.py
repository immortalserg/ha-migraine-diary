"""Configuration and options for Migraine Diary."""
from __future__ import annotations

import voluptuous as vol
from homeassistant import config_entries

from . import DOMAIN

LANGUAGES = {
    "auto": "Automatic (Home Assistant language)",
    "ru": "Русский",
    "en": "English",
    "fr": "Français",
    "de": "Deutsch",
    "it": "Italiano",
    "lu": "Lëtzebuergesch",
}


class MigraineDiaryConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="Migraine Diary", data={})
        return self.async_show_form(step_id="user")

    @staticmethod
    def async_get_options_flow(config_entry):
        return MigraineDiaryOptionsFlow()


class MigraineDiaryOptionsFlow(config_entries.OptionsFlow):
    async def async_step_init(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="", data={"language": user_input["language"]})
        selected = self.config_entry.options.get("language", "auto")
        schema = vol.Schema({
            vol.Required("language", default=selected): vol.In(LANGUAGES)
        })
        return self.async_show_form(step_id="init", data_schema=schema)
