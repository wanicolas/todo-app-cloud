# Accessibilité Numérique (A11y) - Référentiels et Actions

Ce chapitre présente les standards adoptés et les mesures techniques mis en œuvre pour rendre l'application accessible aux personnes en situation de handicap.

## Justification des Référentiels Adoptés

- **RGAA v4.1.2 (Référentiel Général d'Amélioration de l'Accessibilité)** : Choisi comme référentiel principal. Il transpose les normes internationales **WCAG 2.1** au niveau de conformité réglementaire **AA** (double A) obligatoire en France.
- **Référentiel OPQUAST (Bonnes Pratiques de Qualité Web)** : Mobilisé pour harmoniser la qualité globale (formulaires, navigation, gestion du consentement RGPD et prévention des erreurs d'utilisabilité).

## Actions Techniques Mises en Œuvre

L'application a été auditée et corrigée pour répondre aux critères essentiels des référentiels :

- **Structure Sémantique (Landmarks)** :
  - L'ensemble de l'application est enveloppé dans une balise `<main>` (via l'attribut `as="main"` sur le conteneur principal dans [App.tsx](../client/src/App.tsx)) définissant le repère principal pour les lecteurs d'écran.
  - L'en-tête de page et sa navigation sont délimités par une balise `<header role="banner">` et un élément `<nav aria-label="Account navigation">`.
- **Hiérarchie des Titres (Headings)** :
  - Chaque page indépendante possède **un unique titre principal `h1`** de premier niveau (Greeting sur l'accueil, titre de carte sur les pages Login et Register, et page de compte).
  - Les sous-titres (comme la section RGPD sur la page compte) sont passés en titre `h2` (avec classe visuelle de bootstrap pour le style) pour éviter les sauts hiérarchiques (erreur d'accessibilité fréquente).
- **Contrôles de Formulaires & Boutons d'Icônes** :
  - Les boutons d'action sans texte visible (case à cocher interactive de complétion et icône corbeille dans [ItemDisplay.tsx](../client/src/components/ItemDisplay.tsx)) sont équipés d'attributs **`aria-label`** descriptifs et dynamiques (ex: `"Mark item as incomplete"`, `"Remove Item"`). Les icônes SVG disposent de l'attribut `aria-hidden="true"`.
  - Tous les champs de saisie (Login, Inscription, Compte) lient sémantiquement les balises `<label>` et `<input>` via la propriété `controlId` de React-Bootstrap, garantissant l'annonce vocale correcte lors de la focalisation.
- **Navigation au Clavier** :
  - Aucun contour de focus par défaut n'a été masqué via CSS (pas de `outline: none`). L'utilisateur naviguant à l'aide de la touche `Tab` bénéficie d'une visibilité claire sur l'élément actif.
