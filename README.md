# Migraine Diary for Home Assistant

**A local migraine and headache diary for Home Assistant**, with a configurable Lovelace card, optional food logging, and complete CSV export. The integration records events; it does **not** diagnose migraine, identify triggers, or perform medical analysis.

**Languages:** [English](README.md) · [Русский](docs/README.ru.md) · [Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Italiano](docs/README.it.md) · [Lëtzebuergesch](docs/README.lb.md)

## Features

- **Episodes:** start and end a migraine/headache episode; correct the start time; register a completed past episode.
- **Pain:** record intensity, choose pain locations on the bundled head SVG (19 zones), and select symptoms.
- **Symptoms and medication:** log warning signs, symptoms, medication names, doses, units, and event times.
- **Food diary:** record foods, quantities, notes, and consumption time; edit or delete food entries.
- **Three card modes:** migraine only, migraine + food, or food only. You can place two independent cards on the same dashboard.
- **History and calendar:** view diary entries and past episodes.
- **Complete CSV export:** export the entire recorded history, including food, episodes, symptoms, and medication, without a 1,000-record cap. CSV is UTF-8 with BOM and uses a semicolon separator.
- **Home Assistant integration:** entities and services for automations; local SQLite storage; visual card editor and language selection.

## Installation through HACS

1. Open **HACS → ⋮ → Custom repositories**.
2. Enter `https://github.com/immortalserg/ha-migraine-diary` and select **Integration**.
3. Install **Migraine Diary** and restart Home Assistant.
4. Open **Settings → Devices & services → Add integration**, search for **Migraine Diary**, and finish setup.
5. Open a dashboard, edit it, and add the **Migraine Diary** custom card (or use a manual card).

This is a **custom HACS repository**, not a built-in HACS catalog listing. New tagged releases are published by GitHub Actions when the manifest version changes on `main`.

### Manual installation

Copy `custom_components/migraine_diary` to `<config>/custom_components/migraine_diary`, restart Home Assistant, and add the integration. The bundled JavaScript and SVG resources are registered automatically; **do not manually add a Lovelace JavaScript resource**.

## Card configuration

The visual editor supports card options, including mode and language. Example manual configurations:

**Migraine only**
```yaml
type: custom:migraine-diary-card
card_mode: migraine
profile_id: patient
```

**Migraine and food**
```yaml
type: custom:migraine-diary-card
card_mode: both
profile_id: patient
```

**Food only**
```yaml
type: custom:migraine-diary-card
card_mode: food
profile_id: patient
```

Use the same `profile_id` on both cards to record events in the same diary. Food-only mode hides migraine controls. The food form can also be hidden in migraine mode.

## Languages

The integration and card support **English (`en`), Russian (`ru`), French (`fr`), German (`de`), Italian (`it`), and Luxembourgish (`lb` / `lu`)**. Select **Automatic** in integration options to follow the Home Assistant interface language, or choose a language explicitly. The card can override this with, for example, `language: fr`.

## Export and data

Use the card's **Export CSV** action to download the complete timeline. Columns include `date`, `event`, `level`, `zones`, `symptoms`, `medication`, `food`, `quantity`, `notes`, `dose`, `unit`, `episode_id`, and `id`. Open the file in LibreOffice Calc, Excel, or a script of your choice. The integration does not infer causality between foods and headaches.

Diary data is stored locally in Home Assistant's SQLite-backed integration storage. Protect your Home Assistant account and backups: exported CSV files contain potentially sensitive health information.

## Services and automation

The integration exposes services such as `migraine_diary.start_episode`, `end_episode`, `record_past_episode`, `correct_active_start`, `record_premonition`, `record_pain`, `record_medication`, `record_food`, `update_food`, `delete_food`, `list_history`, and `export_csv`. Service schemas and required fields are available under **Developer tools → Actions**. The diary also provides Home Assistant entities representing the active episode and recent records.

## Support, privacy and disclaimer

- **Issues and feature requests:** [GitHub Issues](https://github.com/immortalserg/ha-migraine-diary/issues)
- **Releases:** [GitHub Releases](https://github.com/immortalserg/ha-migraine-diary/releases)
- **License:** [MIT](LICENSE)

Migraine Diary is a personal recording tool, **not** a medical device or a substitute for professional medical advice. Data stays within the user's Home Assistant environment unless exported or shared. Home Assistant administrators are responsible for access controls and backups.
