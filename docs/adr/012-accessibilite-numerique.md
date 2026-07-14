# ADR-012 : Intégration de l'Accessibilité Numérique (RGAA v4 & OPQUAST)

**Date** : juillet 2026  
**Statut** : Accepté

## Contexte

L'application logicielle doit être conforme aux exigences d'accessibilité numérique pour les personnes en situation de handicap, et le référentiel d'accessibilité choisi doit être présenté et justifié.

Jusqu'ici, l'interface utilisateur comportait des formulaires standards sans repères sémantiques clairs ni gestion rigoureuse de la hiérarchie des en-têtes, ce qui rendait la navigation par lecteur d'écran ou par clavier fastidieuse et non conforme.

## Décision

Nous avons décidé d'adopter les standards de qualité et d'accessibilité suivants :

1. **RGAA v4.1.2** (Référentiel Général d'Amélioration de l'Accessibilité) : Choisi comme référentiel principal car il s'agit du standard légal officiel en France (transposition des critères WCAG 2.1 AA).
2. **Référentiel OPQUAST** : Choisi comme standard complémentaire pour les bonnes pratiques de qualité et d'inclusion web.

### Actions techniques appliquées :

- **Balises de repères (Landmarks)** : Enveloppement de la structure globale du routeur dans un élément `<main>` (via l'attribut `as="main"` de React-Bootstrap sur le conteneur principal). Enveloppement de la barre d'outils utilisateur dans un `<header role="banner">` et des liens d'actions dans des balises `<nav>` équipées d'attributs `aria-label` descriptifs (ex: `Account navigation`).
- **Correction de la hiérarchie des titres** : Restructuration des pages pour qu'elles ne possèdent qu'un seul titre `h1` de premier niveau. Correction des sauts hiérarchiques sur la page de compte en transformant un titre `h6` en `h2` (avec classe visuelle `.h6` pour préserver le design).
- **Contrôles et boutons d'icônes** : Ajout d'attributs `aria-label` descriptifs et dynamiques sur les boutons n'ayant pas de texte visible (ex: les boutons de complétion et de suppression de tâches dans la liste).
- **Liaison des formulaires** : Utilisation systématique de la propriété `controlId` de React-Bootstrap pour garantir la liaison sémantique native entre les balises `<label>` et `<input>` (facilitant l'annonce vocale lors de la focalisation).

## Conséquences

- L'application est utilisable en autonomie par des personnes naviguant exclusivement au clavier ou via une synthèse vocale.
- Conformité réglementaire assurée pour le rendu RNCP.
- La structure du code HTML produit par le framework React est sémantiquement propre et standardisée.
