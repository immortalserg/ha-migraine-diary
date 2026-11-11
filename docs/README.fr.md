# Journal de migraine pour Home Assistant

[English](../README.md) · [Русский](README.ru.md) · **Français** · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Lëtzebuergesch](README.lb.md)

**Migraine Diary** est une intégration locale Home Assistant pour consigner les crises de migraine, les maux de tête, les symptômes, les médicaments et l'alimentation. Elle enregistre les faits sans poser de diagnostic ni analyser les causes.

## Fonctionnalités
- Démarrer et terminer une crise, corriger l'heure de début et ajouter une crise passée.
- Noter l'intensité, sélectionner les zones douloureuses sur un schéma SVG (19 zones), enregistrer symptômes et signes précurseurs.
- Consigner les médicaments, doses, unités et heures de prise.
- Journal alimentaire avec produit, quantité, notes et heure; modification et suppression des entrées.
- Historique et calendrier des crises.
- Trois modes de carte : **migraine**, **migraine + alimentation** ou **alimentation uniquement**. Deux cartes peuvent partager un même profil.
- Export CSV intégral, sans limite de 1 000 événements, en UTF-8 avec BOM et séparateur `;`.
- Stockage SQLite local, entités et actions Home Assistant.

## Installation avec HACS
1. Dans **HACS → ⋮ → Dépôts personnalisés**, ajoutez `https://github.com/immortalserg/ha-migraine-diary` en catégorie **Integration**.
2. Installez **Migraine Diary**, puis redémarrez Home Assistant.
3. Allez dans **Paramètres → Appareils et services → Ajouter une intégration**, choisissez **Migraine Diary**.
4. Ajoutez la carte au tableau de bord. Les ressources JavaScript et SVG sont enregistrées automatiquement.

Installation manuelle : copiez `custom_components/migraine_diary` dans `<config>/custom_components/`, puis redémarrez.

## Configuration de la carte
L'éditeur visuel permet de régler la carte. Exemple YAML :
```yaml
type: custom:migraine-diary-card
card_mode: both
profile_id: patient
language: fr
```
`card_mode` : `migraine`, `both` ou `food`. Utilisez le même `profile_id` pour plusieurs cartes du même journal. Le formulaire alimentaire peut aussi être masqué.

## Langues, export et automatisation
Langues : anglais (`en`), russe (`ru`), français (`fr`), allemand (`de`), italien (`it`) et luxembourgeois (`lb` / `lu`). Le mode automatique suit la langue de Home Assistant.

L'export CSV contient les colonnes `date`, `event`, `level`, `zones`, `symptoms`, `medication`, `food`, `quantity`, `notes`, `dose`, `unit`, `episode_id`, `id`. Le fichier peut être ouvert dans LibreOffice, Excel ou analysé séparément.

Actions du domaine `migraine_diary` : `start_episode`, `end_episode`, `record_past_episode`, `correct_active_start`, `record_premonition`, `record_pain`, `record_medication`, `record_food`, `update_food`, `delete_food`, `list_history`, `export_csv`. Consultez **Outils de développement → Actions** pour les paramètres.

## Confidentialité
Les données restent sur votre installation Home Assistant sauf export ou partage. Protégez les sauvegardes et fichiers CSV contenant des informations de santé. Cette intégration **n'est pas un dispositif médical**.

[Signaler un problème](https://github.com/immortalserg/ha-migraine-diary/issues) · [Versions](https://github.com/immortalserg/ha-migraine-diary/releases) · [Licence MIT](../LICENSE)
