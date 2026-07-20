# Présentation du Prototype & Spécificités Ergonomiques

Le prototype réalisé est une **Single Page Application (SPA)** développée avec **React 19** et **TypeScript**. Il cible des environnements multi-équipements (Web de bureau, tablettes et terminaux mobiles) grâce à une structure d'interface entièrement responsive utilisant le système de grille fluide de **React-Bootstrap** et du CSS personnalisé.

## Interface d'Authentification (Mire de Connexion et Inscription)

L'accès à l'application est protégé. L'interface propose deux parcours simples, sémantiques et conformes aux bonnes pratiques d'accessibilité (champs de saisie liés à leurs libellés HTML).

- **Connexion** : L'utilisateur fournit son adresse email et son mot de passe.
  - _État initial_ : Le formulaire est vide et l'action de soumission est désactivée tant que les critères minimaux ne sont pas remplis.
  - _Saisie complétée_ : Le bouton "Se connecter" s'active et passe au bleu primaire, guidant visuellement l'utilisateur.

|        Formulaire de connexion vide         |         Formulaire de connexion complété          |
| :-----------------------------------------: | :-----------------------------------------------: |
| ![Connexion vide](./images/login_empty.png) | ![Connexion complétée](./images/login_filled.png) |

- **Inscription** : Pour s'enregistrer, un email et un mot de passe fort sont requis.
  - _Conformité RGPD_ : L'inscription intègre une case à cocher explicite de consentement pour le traitement des données personnelles, bloquant la validation si elle n'est pas cochée.

|                 Inscription vide                 |                 Inscription complétée                  |
| :----------------------------------------------: | :----------------------------------------------------: |
| ![Inscription vide](./images/register_empty.png) | ![Inscription complétée](./images/register_filled.png) |

## Tableau de Bord (Gestion de la Liste de Tâches)

Une fois connecté, l'utilisateur est redirigé vers son tableau de bord personnel. La navigation est conçue pour limiter la charge cognitive et permettre une interaction rapide, au clavier comme à la souris.

- **État vide (Empty State)** : Conformément aux recommandations OPQUAST, si l'utilisateur n'a aucune tâche, un message informatif et imagé l'invite chaleureusement à saisir sa première note.
- **Saisie dynamique** : L'interface permet d'écrire le titre d'une tâche. Une validation en temps réel bloque la saisie de chaînes vides.
- **Liste interactive** : Chaque tâche apparaît sous forme de ligne avec deux contrôles d'accessibilité (des boutons d'icône équipés d'attributs `aria-label` dynamiques pour la lecture vocale). La tâche peut être cochée (elle apparaît alors barrée) ou supprimée (clic sur l'icône de corbeille).

|               Dashboard vide                |                Saisie en cours                |               Liste de tâches active                |
| :-----------------------------------------: | :-------------------------------------------: | :-------------------------------------------------: |
| ![Dashboard vide](./images/notes_empty.png) | ![Saisie en cours](./images/notes_filled.png) | ![Liste de tâches active](./images/notes_added.png) |

## Espace de Gestion de Compte (Conformité RGPD & Sécurité)

Une page dédiée « Mon Compte » permet à l'utilisateur de gérer ses informations et d'exercer ses droits réglementaires :

- **Évolutivité des informations** : Modification sécurisée de l'adresse email et du mot de passe en cours de session.
- **Portabilité des données (RGPD - Art. 20)** : Un bouton permet d'exporter instantanément toutes les données détenues (profil et ensemble des tâches associé) sous format structuré JSON.
- **Droit à l'oubli (RGPD - Art. 17)** : Un bouton de suppression définitive permet d'effacer le profil de la base d'authentification et de purger toutes ses tâches en base de données, sans laisser d'éléments orphelins.

| Page de gestion de compte et exercice du RGPD |
| :-------------------------------------------: |
|  ![Gestion de compte](./images/account.png)   |
