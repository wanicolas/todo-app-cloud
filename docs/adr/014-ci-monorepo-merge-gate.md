# ADR-014 : Refonte de la CI - Monorepo & Pattern "Merge Gate"

**Date** : juillet 2026  
**Statut** : Accepté (Superpose et remplace [ADR-004](004-ci-multi-pipeline.md))

## Contexte

L'architecture initiale à trois pipelines CI indépendants (client, backend, auth) présentait un problème majeur avec les règles de protection de branches de GitHub ("Required Status Checks").

Si une Pull Request ne modifiait que le code du `backend`, les workflows `ci-client` et `ci-auth` étaient ignorés (skipped). Cependant, GitHub bloquait indéfiniment la fusion de la PR car il attendait que les statuts de validation client et auth repassent au vert (les statuts ignorés ne renvoyant pas de signal de succès à GitHub).

## Décision

Nous avons décidé de restructurer la CI en passant à un modèle de **pipeline monorepo consolidé** :

1. **Workflow centralisé** : Suppression des fichiers `ci-backend.yml`, `ci-client.yml` et `ci-auth.yml` au profit d'un unique fichier [ci.yml](file:///.github/workflows/ci.yml).
2. **Détection par filtre de chemins** : Utilisation de l'action `dorny/paths-filter` au début du workflow pour déterminer précisément quels répertoires ont été modifiés.
3. **Pattern "Merge Gate"** :
   - Création d'un job de clôture nommé `ci-success` s'exécutant toujours à la fin (`if: always()`).
   - Ce job vérifie dynamiquement les résultats de tous les jobs de build et de test. Si l'un des jobs exécutés a échoué, `ci-success` échoue. Si certains jobs ont été ignorés (skipped) mais que tous les jobs exécutés ont réussi, `ci-success` réussit.
   - Dans les paramètres GitHub de protection de la branche `main` et `develop`, seule la validation du job `ci-success` est configurée comme obligatoire pour autoriser le merge.
4. **Moindre Privilège & Repository Privé** : Suite au passage du dépôt en mode privé, ajout explicite du droit `permissions: pull-requests: read` pour permettre à `paths-filter` d'interroger les APIs de GitHub pour inspecter les diffs de PR de manière sécurisée.

## Conséquences

- **Expérience Développeur (DX) fluide** : Plus de blocage de merge injustifié sur les PRs partielles.
- **Optimisation des ressources de build** : Seuls les conteneurs modifiés sont testés et compilés dans la CI.
- **Maintenance simplifiée** : Toute la logique de validation de l'intégration continue est regroupée dans un seul fichier de configuration.
