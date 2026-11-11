# Migränetagebuch für Home Assistant

[English](../README.md) · [Русский](README.ru.md) · [Français](README.fr.md) · **Deutsch** · [Italiano](README.it.md) · [Lëtzebuergesch](README.lb.md)

**Migraine Diary** ist eine lokale Home-Assistant-Integration zur Dokumentation von Migräneanfällen, Kopfschmerzen, Symptomen, Medikamenten und Ernährung. Sie zeichnet Ereignisse auf, stellt aber keine Diagnosen und analysiert keine Auslöser.

## Funktionen
- Anfälle beginnen und beenden, Beginn korrigieren und vergangene Anfälle nachtragen.
- Schmerzstärke erfassen, Schmerzbereiche auf einer SVG-Kopfgrafik (19 Zonen) auswählen sowie Symptome und Vorzeichen dokumentieren.
- Medikamente mit Name, Dosis, Einheit und Einnahmezeit erfassen.
- Ernährungstagebuch mit Lebensmitteln, Mengen, Notizen und Uhrzeit; Einträge bearbeiten oder löschen.
- Verlauf und Kalender der Anfälle.
- Drei Kartenmodi: **nur Migräne**, **Migräne und Ernährung**, **nur Ernährung**. Zwei Karten können dasselbe Profil verwenden.
- Vollständiger CSV-Export ohne 1.000-Einträge-Grenze, UTF-8 mit BOM und Semikolon als Trennzeichen.
- Lokale SQLite-Speicherung sowie Home-Assistant-Entitäten und Aktionen.

## Installation mit HACS
1. Unter **HACS → ⋮ → Benutzerdefinierte Repositories** die URL `https://github.com/immortalserg/ha-migraine-diary` als **Integration** hinzufügen.
2. **Migraine Diary** installieren und Home Assistant neu starten.
3. Unter **Einstellungen → Geräte & Dienste → Integration hinzufügen** die Integration einrichten.
4. Die Karte zum Dashboard hinzufügen. JavaScript und SVG werden automatisch registriert.

Manuelle Installation: `custom_components/migraine_diary` nach `<config>/custom_components/` kopieren und Home Assistant neu starten.

## Kartenkonfiguration
Die Karte besitzt einen visuellen Editor. YAML-Beispiel:
```yaml
type: custom:migraine-diary-card
card_mode: both
profile_id: patient
language: de
```
`card_mode`: `migraine`, `both` oder `food`. Für zwei Karten desselben Tagebuchs dieselbe `profile_id` verwenden. Das Ernährungsformular kann separat ausgeblendet werden.

## Sprachen, Export und Automatisierung
Unterstützt werden Englisch (`en`), Russisch (`ru`), Französisch (`fr`), Deutsch (`de`), Italienisch (`it`) und Luxemburgisch (`lb` / `lu`). Der Automatikmodus verwendet die Home-Assistant-Sprache.

CSV-Spalten: `date`, `event`, `level`, `zones`, `symptoms`, `medication`, `food`, `quantity`, `notes`, `dose`, `unit`, `episode_id`, `id`. Die Datei eignet sich für LibreOffice, Excel und externe Auswertungen.

Aktionen unter `migraine_diary`: `start_episode`, `end_episode`, `record_past_episode`, `correct_active_start`, `record_premonition`, `record_pain`, `record_medication`, `record_food`, `update_food`, `delete_food`, `list_history`, `export_csv`. Parameter stehen unter **Entwicklerwerkzeuge → Aktionen**.

## Datenschutz
Gesundheitsdaten bleiben lokal, sofern sie nicht exportiert oder geteilt werden. CSV-Dateien, Zugänge und Backups schützen. Diese Integration **ist kein Medizinprodukt** und ersetzt keine ärztliche Beratung.

[Fehler melden](https://github.com/immortalserg/ha-migraine-diary/issues) · [Releases](https://github.com/immortalserg/ha-migraine-diary/releases) · [MIT-Lizenz](../LICENSE)
