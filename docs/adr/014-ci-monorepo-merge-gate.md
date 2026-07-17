# ADR-014 : Refonte de la CI - Monorepo, Pattern "Merge Gate", Fail-Fast et Actions Composites

**Date** : juillet 2026  
**Statut** : Accepté (Superpose et remplace [ADR-004](004-ci-multi-pipeline.md))

## Contexte

L'architecture initiale à trois pipelines CI indépendants (client, backend, auth) présentait un problème majeur avec les règles de protection de branches de GitHub ("Required Status Checks"). Si une Pull Request ne modifiait que le code du `backend`, les workflows `ci-client` et `ci-auth` étaient ignorés (skipped). Cependant, GitHub bloquait indéfiniment la fusion de la PR car il attendait que les statuts de validation client et auth repassent au vert.

De plus, les pipelines de scans de sécurité Trivy et de tests de bout en bout (E2E Playwright) étaient exécutés de manière complètement indépendante (et parallèle) aux tests unitaires, provoquant une surcharge de ressources CPU de l'agent GitHub et des pertes de temps si un simple test unitaire ou de formatage de code échouait. La logique de setup Node, d'installation de dépendances et de scans d'images était également dupliquée dans plusieurs fichiers.

## Décision

Nous avons décidé de restructurer et d'optimiser l'intégration continue (CI) en appliquant les décisions suivantes :

1. **Workflow centralisé & Fusion de pipelines** :
   - Regroupement de tous les workflows (`ci-e2e.yml`, `ci-trivy.yml` et les workflows par services) dans un unique fichier [ci.yml](file:///.github/workflows/ci.yml).
2. **Détection par filtre de chemins (paths-filter)** :
   - Utilisation de `dorny/paths-filter@v4` au début du workflow pour déterminer précisément les répertoires modifiés.
3. **Orchestration Fail-Fast** :
   - Mise en œuvre d'une séquence stricte de validation : les jobs lourds et coûteux en ressources (**Trivy** et **E2E Playwright**) ne s'exécutent que si les tests unitaires, le linter et le typecheck des microservices (`backend`, `client`, `auth`) réussissent.
4. **Actions Composites Réutilisables (DRY)** :
   - Création de deux actions locales réutilisables dans le dépôt pour centraliser les scripts et configurations :
     - `.github/actions/node-ci` : Configure Node, gère le cache npm global, lance l'installation, ESLint, Typecheck, le build et la couverture de tests.
     - `.github/actions/trivy-scan` : Lance le scan de vulnérabilités Trivy de manière standardisée avec `exit-code: 1` sur les failles HIGH/CRITICAL.
5. **Caching Avancé Docker Buildx** :
   - Utilisation de `docker/setup-buildx-action` et `docker/build-push-action` dans la CI/CD.
   - Activation du cache natif de GitHub Actions avec le mode maximal (**`cache-from: type=gha`** et **`cache-to: type=gha,mode=max`**) pour sauvegarder et réutiliser les couches de conteneurs construites, réduisant les temps de build de plusieurs minutes à quelques secondes.
6. **Pattern "Merge Gate"** :
   - Création du job final consolidé `ci-success` (`if: always()`). Il valide l'exécution globale (même en cas de jobs ignorés). Seul ce check final est obligatoire sur GitHub pour débloquer le merge.

## Conséquences

- **Maintenance simplifiée** : Disparition de la duplication de code dans les pipelines (DRY).
- **Expérience Développeur fluide** : Les fusions ne sont plus bloquées injustement, et le feedback de build est accéléré par le cache Buildx et l'approche Fail-Fast.
- **Réduction des coûts** : Moins de temps de calcul CPU consommé sur les agents GitHub.

