# Plan de Correction des Bogues - Todo App Cloud

Ce document décrit les anomalies identifiées lors de la phase de recette technique et applicative du projet, ainsi que les correctifs appliqués.

## 1. Suivi et Qualification des Anomalies

Nous utilisons une classification par sévérité pour traiter les bogues :

- **Bloquant** : L'application ou une partie majeure (ex: les tests, le build Docker, l'authentification) crash.
- **Majeur** : Une fonctionnalité métier essentielle échoue ou comporte une faille de sécurité importante.
- **Mineur** : Problème esthétique ou d'utilisabilité sans impact sur la stabilité.

## 2. Registre des Bogues et Correctifs Appliqués

### B-01 : Crash des tests en environnement Docker (SQLite3 / GLIBC)

- **Symptôme** : Lors de l'exécution des tests du backend en conteneur, Jest échouait immédiatement avec l'erreur `/lib/x86_64-linux-gnu/libm.so.6: version 'GLIBC_2.38' not found`.
- **Sévérité** : Bloquant.
- **Analyse** : Le package `sqlite3` avait été mis à jour en version `6.0.1`. Les binaires pré-compilés de cette version exigent la version 2.38 de GLIBC. Or, l'image officielle de base `node:22` (Debian Bookworm) embarque GLIBC 2.36.
- **Correction** : Downgrade du package `sqlite3` à la version stable **`5.1.7`** dans [package.json](file:///home/nicolaswalter/Ynov/Cloud/todo-app-cloud/backend/package.json).
- **Résultat** : La compilation et le chargement du binaire SQLite3 s'effectuent sans aucune erreur. Les tests passent à 100%.

### B-02 : Crash serveur (TypeError 500) sur mise à jour de tâche inexistante

- **Symptôme** : Si un utilisateur tentait d'appeler l'API de modification sur un identifiant de tâche inexistant ou appartenant à un autre utilisateur, le serveur backend crashait avec un code HTTP 500.
- **Sévérité** : Majeur (Sécurité & Robustesse).
- **Analyse** : La fonction `updateItem` modifiait la ligne dans Knex, puis appelait `getItem(userId, id)` pour retourner l'état mis à jour. N'ayant rien trouvé, Knex renvoyait `undefined`. La fonction `mapRow(row)` tentait alors de lire `row.id` sur une valeur non définie, levant une exception non gérée.
- **Correction** :
  1. Modification de `mapRow(row)` dans `KnexRepository.ts` pour retourner `null` si `row` est indéfini.
  2. Ajout d'une vérification d'existence dans le contrôleur `updateItem.ts` renvoyant proprement un code `404 Not Found` au lieu d'une erreur 500.

### B-03 : Risque de Fail-Open sur la configuration JWT

- **Symptôme** : En cas de problème de lecture du fichier secret JWT en production, le microservice d'authentification basculait silencieusement sur la clé de secours par défaut `'dev-insecure-secret'`.
- **Sévérité** : Majeur (Sécurité).
- **Analyse** : Ce fallback automatique permettait à un attaquant de forger de faux jetons en production si le fichier secret n'était pas monté correctement dans Kubernetes.
- **Correction** : Modification de `AuthService.ts` pour lever explicitement une exception critique (`throw Error`) si la configuration de production est invalide, empêchant le conteneur de démarrer et alertant l'équipe d'exploitation.

## 3. Plan d'Amélioration Continue (Maintien en Condition)

Pour éviter la régression de la qualité du code :

1. **Intégration Continue (CI)** : Exécution automatisée de `npm run test` et `npm run lint` à chaque Pull Request pour intercepter les bogues de syntaxe ou de logique avant la fusion sur la branche principale.
2. **Dependabot** : Analyse automatique hebdomadaire de la sécurité du code pour détecter les CVEs dans les dépendances tierces et générer les PRs de mise à jour.
