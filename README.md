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
- Support Russian and English interfaces.

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

License to be selected before public distribution.
