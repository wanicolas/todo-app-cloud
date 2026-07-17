# Manuel d'Utilisation - Todo App Cloud

Ce manuel décrit les fonctionnalités de l'application **Todo App Cloud** et la manière de les utiliser au quotidien.

## 1. Accès à l'Application et Authentification

L'application requiert un compte utilisateur pour isoler de manière sécurisée vos tâches.

### A. Créer un compte (Inscription)

1. Sur la page d'accueil, cliquez sur **S'inscrire** (Register).
2. Saisissez une adresse email valide et un mot de passe robuste.
3. Cliquez sur le bouton de soumission. Votre compte est créé et vous êtes automatiquement connecté.

### B. Se connecter (Connexion)

1. Sur la page de connexion, saisissez vos identifiants (email et mot de passe).
2. Cliquez sur **Se connecter**.
3. _Note de sécurité :_ L'application utilise des cookies sécurisés (`HttpOnly`). Vous restez connecté de manière sécurisée même si vous fermez l'onglet de votre navigateur.

## 2. Gestion des Tâches (Todos)

Une fois connecté, vous arrivez sur votre tableau de bord personnel.

```
+-------------------------------------------------------+
|  Mon Compte [Bouton]                       Déconnexion|
+-------------------------------------------------------+
|  [ Saisir une nouvelle tâche...          ] [Ajouter]  |
|                                                       |
|  [ ] Acheter du pain                     [Corbeille]  |
|  [x] Déployer sur AKS (Terminé)           [Corbeille]  |
+-------------------------------------------------------+
```

### A. Ajouter une tâche

1. Saisissez le libellé de votre tâche dans le champ de texte (ex: `Acheter du pain`).
2. Appuyez sur la touche **Entrée** de votre clavier ou cliquez sur le bouton **Ajouter**.
3. La tâche s'ajoute instantanément en haut de votre liste.

### B. Marquer une tâche comme terminée (ou en cours)

1. Cochez la case (checkbox) située à gauche de la tâche.
2. Le texte de la tâche se barre pour indiquer sa complétion.
3. _Note :_ Décocher la case rétablit le statut de la tâche en cours.

### C. Supprimer une tâche

1. Cliquez sur le bouton **Corbeille** rouge situé à droite de la tâche.
2. La tâche est définitivement supprimée de votre liste.

## 3. Gestion du Compte & Conformité RGPD

Conformément à la réglementation sur la protection des données (RGPD), vous disposez d'un contrôle total sur vos informations personnelles.

### A. Accéder aux paramètres

1. Cliquez sur le bouton **Mon Compte** (Account) situé en haut de l'interface.

### B. Droit à l'oubli (Suppression définitive)

1. Sur la page de gestion du compte, cliquez sur le bouton rouge **Supprimer mon compte**.
2. **Attention :** Cette action est irréversible. Elle va supprimer immédiatement votre profil utilisateur ainsi que l'intégralité des tâches associées stockées en base de données.

## 4. Accessibilité et Raccourcis

L'application a été conçue pour être utilisable par tous :

- **Navigation au clavier** : Utilisez la touche **Tab** pour naviguer de manière ordonnée entre les champs de saisie, les cases à cocher et les boutons. Utilisez la touche **Espace** pour cocher/décocher une tâche et la touche **Entrée** pour valider les formulaires.
- **Lecteurs d'écran** : Tous les éléments interactifs possèdent des labels explicites (ex: les boutons de suppression ou de complétion d'icônes sont annoncés vocalement grâce aux attributs `aria-label`).
