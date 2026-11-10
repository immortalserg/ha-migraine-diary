# Prototype Lovelace card — manual test installation

**Development build only.** Do not use this as the sole medical record. Back up your Home Assistant configuration first.

1. Copy `custom_components/migraine_diary/` from this repository to `<config>/custom_components/migraine_diary/`.
2. Copy `frontend/migraine-diary-card.js` to `<config>/www/migraine-diary-card.js`.
3. Copy your original `m12.svg` into `<config>/www/floorplan/m12.svg` (the original SVG is not yet bundled in the repository).
4. Restart Home Assistant and add the **Migraine Diary** integration in Settings → Devices & services.
5. In Dashboard → Edit dashboard → Manage resources, add `/local/migraine-diary-card.js` as a **JavaScript module**.
6. Add a manual card:

```yaml
type: custom:migraine-diary-card
profile_id: patient
active_entity: sensor.active_episode
svg_url: /local/floorplan/m12.svg
medications:
  - name: Maxalt
    dose: 10
    unit: mg
  - Nurofen
  - Exedryn
  - Migreaout
```

The actual sensor entity ID may differ; check Settings → Devices & services → Entities.

The card uses the Home Assistant user's language (en, ru, fr, de, it). You can override it with `language: fr`, for example.

## Prototype limitations

- The card records pain intensity and selected SVG zones only while an episode is active.
- Symptom selections are currently UI-only, except when included in a premonition event; they are **not** saved as part of episode start or pain events. This must be fixed before clinical use.
- Medication names and optional doses are configured in YAML, not yet editable in the UI.
- The active episode sensor polls every 30 seconds; the card may show stale button state briefly after an action.
- Food diary, reports, editable catalogs, and episode editing are not implemented.
- Five languages are present for this prototype card; full translations of services and future reports remain to be completed.
- The integration has not yet been validated on a running Home Assistant instance.
