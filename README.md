# Migraine Diary for Home Assistant

A local-first headache and migraine diary for Home Assistant, designed to help patients record episodes and prepare structured reports for clinicians.

> **Development status:** early prototype. Not ready for clinical use or production installation.

## Goals

- Record headache episode start/end times, including manually corrected timestamps.
- Track pain intensity and anatomical locations using an interactive SVG.
- Configure symptoms, aura/prodrome indicators, and medications.
- Log medication doses, administration times, and observed response.
- Optional food diary to explore possible triggers without claiming causality.
- Calendar and clinician-oriented PDF/CSV reports.
- Preserve historical records even when configurable labels are edited.
- Support Russian, English, French, German, Italian, and Luxembourgish interfaces.

## Installation (development preview)

This project is still a development preview. Back up Home Assistant before updating.

1. Copy the `custom_components/migraine_diary` directory into the Home Assistant `config/custom_components/` directory.
2. Restart Home Assistant.
3. Go to **Settings → Devices & services → Add integration** and select **Migraine Diary**.
4. Copy `frontend/migraine-diary-card.js` into `config/www/migraine-diary/migraine-diary-card.js`.
5. Add the Lovelace JavaScript resource `/local/migraine-diary/migraine-diary-card.js` as a **JavaScript module**.
6. Add a manual Lovelace card with type `custom:migraine-diary-card`. If using the head illustration, copy the corresponding SVG asset into `config/www/migraine-diary/head.svg` and configure `svg_url` accordingly.

### Language settings

Choose **Automatic** or a specific language under the integration's **Configure** options. The Lovelace card inherits this setting by default. A card can override it with `language: fr` (or another supported code). Automatic mode uses the Home Assistant user's locale in the card. Entity names on the standard Home Assistant device page follow the Home Assistant user interface language, independently of the integration option.

### HACS

The repository contains `hacs.json`, but HACS installation and update behavior should be verified before declaring a stable release. The frontend card resource may require manual setup.

## Architecture

A custom Home Assistant integration under `custom_components/migraine_diary` with local SQLite persistence and a companion Lovelace card. The existing SVG has 19 pain zones and nine intensity selectors; a migration to a standardized 0–10 scale will be evaluated.

## Development milestones

1. Integration skeleton, configuration flow, database schema and migrations.
2. Episode lifecycle and event logging with tests.
3. Lovelace SVG card and editable symptom/medication catalogs.
4. Calendar, optional food diary, and analytics.
5. Exportable clinician reports and installation documentation.

## Privacy and safety

Medical diary entries remain local to the user's Home Assistant installation unless the user explicitly exports or shares them. Backups and access control must be configured by the administrator.

This project is a recording aid, not a diagnostic or medical decision-making tool.

## License

A distribution license has not yet been selected. Do not assume permission to redistribute or modify the project until a license is published.
