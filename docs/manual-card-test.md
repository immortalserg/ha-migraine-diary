# Migraine Diary — manual Home Assistant test

**Development prototype:** back up your HA configuration before installing. Do not rely on this as the sole medical record.

## Copy files

1. Copy the repository directory `custom_components/migraine_diary/` to `/config/custom_components/migraine_diary/` in Home Assistant.
2. Create `/config/www/migraine-diary/` (a dedicated directory; **no floorplan dependency**).
3. Copy `frontend/migraine-diary-card.js` to `/config/www/migraine-diary/migraine-diary-card.js`.
4. Copy `frontend/head.svg` to `/config/www/migraine-diary/head.svg`.
5. Restart Home Assistant. Go to **Settings → Devices & services → Add integration** and select **Migraine Diary**.
6. In your dashboard, select **Edit → Manage resources**, then add `/local/migraine-diary/migraine-diary-card.js` as a **JavaScript module**.
7. Add a **Manual** card with this YAML:

```yaml
type: custom:migraine-diary-card
profile_id: patient
active_entity: binary_sensor.migren
svg_url: /local/migraine-diary/head.svg
language: lb
medications:
  - name: Maxalt
    dose: 10
    unit: mg
  - Nurofen
  - Exedryn
  - Migreaout
```

The actual binary sensor entity ID may differ; check Settings → Devices & services → Entities and update `active_entity` accordingly.

The binary sensor is read-only: use the start/end actions or the card to change the migraine state.\n\n## Language

The card supports `en`, `ru`, `fr`, `de`, `it`, and `lb` (Luxembourgish). Remove `language: lb` to follow the current Home Assistant user's language.

## Quick test

1. Verify the SVG appears and click two head zones.
2. Start an episode and check that the binary sensor changes to on.
3. Select intensity using the SVG b1–b9 controls and click **Schmäerz späicheren**.
4. Record a medication.
5. End the episode and verify the binary sensor becomes `off`.

If the sensor does not appear, or a service fails, inspect Settings → System → Logs.

## Known limitations

- The prototype has not been tested in a running Home Assistant instance.
- Symptoms selected in the UI are not yet stored with episodes or pain events. Premonition selections are stored.
- Medication names/doses are configured in YAML, not edited in the UI.
- The binary sensor is derived from SQLite and refreshes after successful start/end services; it is read-only.
- Reports, food diary, and editable catalogs are not yet implemented.
