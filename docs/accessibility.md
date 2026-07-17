# Accessibilité Numérique (A11y) - Référentiels et Actions

Ce document présente les choix méthodologiques et techniques mis en œuvre pour assurer l'accessibilité du projet **Todo App Cloud** conformément aux exigences de la compétence **C2.2.3** du RNCP.

---

## 1. Choix et Justification des Référentiels

Pour ce projet, deux référentiels de qualité et d'accessibilité web ont été sélectionnés :

### A. RGAA v4.1.2 (Référentiel Général d'Amélioration de l'Accessibilité)

- **Justification** : Le RGAA est le référentiel officiel français obligatoire pour les services publics et de plus en plus exigé dans le secteur privé. Il transpose les normes internationales **WCAG 2.1** (Web Content Accessibility Guidelines) au niveau de conformité **AA** (double A).
- **Application** : Validation de la navigation clavier, de la structure sémantique et de la compatibilité avec les lecteurs d'écran (ex. NVDA, VoiceOver).

### B. Référentiel OPQUAST (Bonnes Pratiques de Qualité Web)

- **Justification** : OPQUAST est le standard de référence en France pour la qualité globale des sites internet (contenant de nombreuses règles dédiées à l'accessibilité, à l'éco-conception, au RGPD et à la sécurité).
- **Application** : Alignement sur les fiches de bonnes pratiques pour les formulaires, la navigation et le respect de la vie privée des utilisateurs.

---

## 2. Actions Techniques Mises en Œuvre

L'application a été auditée et corrigée pour répondre aux critères essentiels des référentiels choisis :

### A. Structure Sémantique et Repères (Landmarks)

Conformément aux critères du RGAA (Thème 12 : Sémantique et Structure), les composants HTML5 sémantiques ont été intégrés :

- L'ensemble de l'application est enveloppé dans une balise `<main>` (via l'attribut `as="main"` de React-Bootstrap sur le conteneur principal dans [App.tsx](../client/src/App.tsx)). Cela définit le repère principal du document pour les lecteurs d'écran.
- La barre d'en-tête utilisateur et sa navigation de déconnexion sont enveloppées dans une balise `<header role="banner">` et un élément `<nav aria-label="Account navigation">`.
- Sur la page de gestion de compte, les liens de retour sont enveloppés dans un `<nav aria-label="Back navigation">`.

### B. Hiérarchie des Titres (Headings)

Pour garantir une navigation vocale structurée (Thème 12.7 du RGAA) :

- Chaque page indépendante possède désormais **un seul titre principal `h1`** de premier niveau :
  - _Accueil_ : Le message d'accueil dynamique [Greeting.tsx](../client/src/components/Greeting.tsx) sert de `h1` principal.
  - _Login_ : Le titre de la carte de connexion dans [Login.tsx](../client/src/pages/Login.tsx) a été passé en `h1` (avec un style visuel `h3` via bootstrap pour préserver l'ergonomie).
  - _Register_ : Même modification dans [Register.tsx](../client/src/pages/Register.tsx).
  - _Mon compte_ : Même modification dans [Account.tsx](../client/src/pages/Account.tsx).
- Le sous-titre de la section RGPD de la page compte a été passé en `h2` (avec un style de classe `h6`) afin d'éviter tout saut hiérarchique (ex: sauter de `h1` à `h6`), ce qui est une erreur courante d'accessibilité.

### C. Liens et Contrôles de Formulaires

Pour s'assurer que les utilisateurs déficients visuels ou moteurs puissent interagir (Thèmes 11 et 12 du RGAA) :

- **Description textuelle des boutons d'icônes** : Les boutons d'action qui n'ont pas de texte visible (comme la case à cocher de complétion et l'icône de suppression de tâche dans [ItemDisplay.tsx](../client/src/components/ItemDisplay.tsx)) sont équipés d'attributs `aria-label` descriptifs et dynamiques (ex: `"Mark item as incomplete"`, `"Mark item as complete"`, `"Remove Item"`).
- **Liaison des formulaires** : Tous les champs de saisie (Login, Register, Account) utilisent la propriété `controlId` de React-Bootstrap. Cela garantit une liaison HTML native stricte entre la balise `<label>` et le champ `<input>`, permettant aux lecteurs d'écran d'annoncer correctement l'étiquette lors de la focalisation.
- **Accessibilité du consentement** : La case à cocher RGPD sur la page d'inscription possède son texte d'explication directement associé en tant que label, garantissant que l'utilisateur comprend immédiatement l'objet du consentement.

### D. Focus et Contrôle Clavier

- Aucun contour de focus par défaut n'a été masqué via CSS (pas de `outline: none`). L'utilisateur naviguant à la touche `Tab` bénéficie d'une visibilité claire sur l'élément actif.
