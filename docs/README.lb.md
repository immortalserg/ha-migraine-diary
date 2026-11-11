# Migränendagbuch fir Home Assistant

[English](../README.md) · [Русский](README.ru.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · **Lëtzebuergesch**

**Migraine Diary** ass eng lokal Home-Assistant-Integratioun fir Migränattacken, Kappwéi, Symptomer, Medikamenter an Iessen ze dokumentéieren. Si späichert Evenementer, mee stellt keng Diagnos a mécht keng Analys vun den Ursaachen.

## Funktiounen
- Eng Attack ufänken an ofschléissen, d'Ufankszäit korrigéieren an eng fréier Attack nodroen.
- D'Stäerkt vun de Schmäerzen notéieren, 19 Beräicher op enger SVG-Kappgrafik auswielen a Symptomer souwéi Virzeechen erfaassen.
- Medikamenter mat Numm, Doséierung, Eenheet an Zäit registréieren.
- Iessdagbuch mat Liewensmëttel, Quantitéit, Notizen an Zäit; Entréeën änneren oder läschen.
- Historique a Kalenner vun den Attacken.
- Dräi Kaartemodi: **nëmme Migrän**, **Migrän an Iessen**, **nëmmen Iessen**. Zwou Kaarte kënnen dee selwechte Profil benotzen.
- Kompletten CSV-Export ouni Limit vun 1.000 Entréeën, UTF-8 mat BOM a Semikolon als Trennzeechen.
- Lokal SQLite-Späicherung, Home-Assistant-Entitéiten an Aktiounen.

## Installatioun mat HACS
1. Ënner **HACS → ⋮ → Custom repositories** `https://github.com/immortalserg/ha-migraine-diary` als **Integration** dobäisetzen.
2. **Migraine Diary** installéieren an Home Assistant nei starten.
3. Ënner **Settings → Devices & services → Add integration** d'Integratioun **Migraine Diary** derbäisetzen.
4. D'Kaart op den Dashboard setzen. JavaScript an SVG ginn automatesch registréiert.

Manuell Installatioun: `custom_components/migraine_diary` an `<config>/custom_components/` kopéieren an Home Assistant nei starten.

## Kaart astellen
Et gëtt e visuellen Editeur. YAML-Beispill:
```yaml
type: custom:migraine-diary-card
card_mode: both
profile_id: patient
language: lb
```
`card_mode`: `migraine`, `both` oder `food`. Fir zwou Kaarte vum selwechten Dagbuch déiselwecht `profile_id` benotzen. Den Iessformulaire kann och verstoppt ginn.

## Sproochen, Export an Automatisatioun
Ënnerstëtzt ginn Englesch (`en`), Russesch (`ru`), Franséisch (`fr`), Däitsch (`de`), Italienesch (`it`) a Lëtzebuergesch (`lb` / `lu`). Am automatesche Modus gëtt d'Sprooch vun Home Assistant benotzt.

CSV-Kolonnen: `date`, `event`, `level`, `zones`, `symptoms`, `medication`, `food`, `quantity`, `notes`, `dose`, `unit`, `episode_id`, `id`. De Fichier kann a LibreOffice, Excel oder an engem externe Skript benotzt ginn.

Aktiounen am Domaine `migraine_diary`: `start_episode`, `end_episode`, `record_past_episode`, `correct_active_start`, `record_premonition`, `record_pain`, `record_medication`, `record_food`, `update_food`, `delete_food`, `list_history`, `export_csv`. D'Parameter stinn ënner **Developer tools → Actions**.

## Dateschutz
D'Gesondheetsdaten bleiwen lokal, ausser se ginn exportéiert oder gedeelt. CSV-Dateien, Zougang a Backups schützen. D'Integratioun **ass kee medezinescht Gerät** a ersetzt keng medezinesch Berodung.

[Problem mellen](https://github.com/immortalserg/ha-migraine-diary/issues) · [Releases](https://github.com/immortalserg/ha-migraine-diary/releases) · [MIT-Lizenz](../LICENSE)
