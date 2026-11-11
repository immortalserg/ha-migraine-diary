# Diario dell'emicrania per Home Assistant

[English](../README.md) · [Русский](README.ru.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · **Italiano** · [Lëtzebuergesch](README.lb.md)

**Migraine Diary** è un'integrazione locale di Home Assistant per registrare attacchi di emicrania, mal di testa, sintomi, farmaci e alimentazione. Registra i dati senza formulare diagnosi o individuare cause.

## Funzionalità
- Avviare e terminare un attacco, correggerne l'ora iniziale e inserire attacchi passati.
- Registrare l'intensità del dolore, selezionare 19 zone sulla mappa SVG della testa e annotare sintomi e segnali premonitori.
- Registrare farmaci, dosi, unità e orari di assunzione.
- Diario alimentare con alimento, quantità, note e ora; modifica ed eliminazione delle voci.
- Cronologia e calendario degli attacchi.
- Tre modalità della scheda: **solo emicrania**, **emicrania e alimentazione**, **solo alimentazione**. Più schede possono usare lo stesso profilo.
- Esportazione CSV completa, senza limite di 1.000 eventi, UTF-8 con BOM e separatore `;`.
- Archivio SQLite locale, entità e azioni di Home Assistant.

## Installazione con HACS
1. Aprire **HACS → ⋮ → Repository personalizzati** e aggiungere `https://github.com/immortalserg/ha-migraine-diary` come **Integration**.
2. Installare **Migraine Diary** e riavviare Home Assistant.
3. In **Impostazioni → Dispositivi e servizi → Aggiungi integrazione**, selezionare **Migraine Diary**.
4. Aggiungere la scheda alla dashboard. Le risorse JavaScript e SVG vengono registrate automaticamente.

Installazione manuale: copiare `custom_components/migraine_diary` in `<config>/custom_components/` e riavviare.

## Configurazione della scheda
È disponibile un editor visuale. Esempio YAML:
```yaml
type: custom:migraine-diary-card
card_mode: both
profile_id: patient
language: it
```
`card_mode`: `migraine`, `both` o `food`. Usare lo stesso `profile_id` per schede collegate allo stesso diario. Il modulo alimentare può essere nascosto.

## Lingue, esportazione e automazioni
Lingue supportate: inglese (`en`), russo (`ru`), francese (`fr`), tedesco (`de`), italiano (`it`) e lussemburghese (`lb` / `lu`). La modalità automatica segue la lingua di Home Assistant.

Colonne CSV: `date`, `event`, `level`, `zones`, `symptoms`, `medication`, `food`, `quantity`, `notes`, `dose`, `unit`, `episode_id`, `id`. Il file è utilizzabile con LibreOffice, Excel o script esterni.

Azioni `migraine_diary`: `start_episode`, `end_episode`, `record_past_episode`, `correct_active_start`, `record_premonition`, `record_pain`, `record_medication`, `record_food`, `update_food`, `delete_food`, `list_history`, `export_csv`. I parametri sono disponibili in **Strumenti per sviluppatori → Azioni**.

## Privacy
I dati rimangono nell'installazione locale salvo esportazione o condivisione. Proteggere accessi, backup e CSV contenenti dati sanitari. L'integrazione **non è un dispositivo medico**.

[Segnala un problema](https://github.com/immortalserg/ha-migraine-diary/issues) · [Versioni](https://github.com/immortalserg/ha-migraine-diary/releases) · [Licenza MIT](../LICENSE)
