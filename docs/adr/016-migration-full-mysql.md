# ADR 016 : Migration complète vers MySQL (Parité Dev/Prod)

## Contexte
Historiquement, l'application utilisait une base de données MySQL en production, mais s'appuyait sur SQLite en développement local et pour l'exécution des tests. Ce choix avait été fait pour la facilité de mise en place (fichiers locaux, pas de daemon nécessaire) et l'exécution rapide des tests.

Cependant, cette approche violait le principe de **Parité Dev/Prod** (facteur 10 des 12-Factor Apps). Au fil du temps, des problèmes subtils d'incompatibilité entre SQLite et MySQL (comme les types de données, les contraintes de clés étrangères, ou la concurrence) menaçaient d'introduire des bugs en production qui ne seraient pas détectés en développement ou en CI.

## Décision
Nous avons décidé d'abandonner purement et simplement le support de SQLite dans tous les services (`backend` et `auth`) et de basculer 100% de notre cycle de développement et de tests sur des instances MySQL 8.

### Changements apportés :
1. **Désinstallation des dépendances** : Le driver `sqlite3` (et `better-sqlite3`) a été supprimé des `package.json`, réduisant la taille des packages et éliminant le besoin de compilation native (`node-gyp`) sur certaines plateformes.
2. **Infrastructure Docker** : Le `compose.yaml` démarre désormais les bases MySQL pour exposer les ports `3306` et `3307` sur la machine hôte.
3. **Tests d'intégration CI/CD** : Les workflows GitHub Actions (`ci.yml`) injectent des instances de services MySQL éphémères pour valider l'application dans des conditions identiques à la production.
4. **Exécution des tests** : Puisque la base de données est maintenant partagée (contrairement aux fichiers SQLite temporaires instanciés par thread), nous utilisons `jest --runInBand` pour exécuter les tests séquentiellement. Les hooks `beforeEach` / `beforeAll` s'assurent de vider (truncate/delete) les tables pour garantir l'isolation des tests.

## Conséquences
- **Avantages** :
  - Confiance totale dans les tests (iso-production).
  - Élimination des Edge Cases liés au dialecte SQL.
  - Configuration simplifiée (plus de fallback complexe dans les `knexConfig`).
- **Inconvénients** :
  - L'exécution des tests locaux nécessite désormais l'exécution de conteneurs Docker (`docker compose up -d mysql mysql-auth`).
  - L'exécution de `jest` prend légèrement plus de temps en raison de l'exécution séquentielle (`--runInBand`) et des requêtes réseau locales vers les bases.

## Statut
Accepté. (Remplace les mentions d'utilisation de SQLite dans les ADR 003, 006, 007 et 015).
