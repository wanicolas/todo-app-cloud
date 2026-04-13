# ADR-007 : Knex.js comme query builder

**Date** : avril 2026
**Statut** : Accepté

## Contexte

Le backend avait deux implémentations de repository (`SqliteRepository` et `MysqlRepository`) qui utilisaient les drivers natifs (`sqlite3`, `mysql2`) avec du SQL brut dupliqué et des callbacks wrappés en Promises. Le sujet demande d'utiliser un ORM ou query builder pour éviter les injections SQL et faciliter les changements de base de données.

## Décision

On a choisi **Knex.js** comme query builder (pas un ORM complet comme TypeORM ou Sequelize) pour plusieurs raisons :

- **Léger** : Knex est un query builder, pas un ORM — il ne force pas de modèles ni de relations. Pour une table simple comme `todo_items`, un ORM complet serait du sur-engineering.
- **Multi-dialect** : Knex supporte SQLite et MySQL avec la même API. On a pu fusionner les deux repositories en un seul `KnexRepository`, éliminant la duplication de code SQL.
- **Migrations intégrées** : Knex fournit un système de migrations versionnées (`knex.migrate.latest()`), ce qui remplace le `CREATE TABLE IF NOT EXISTS` qu'on avait dans chaque `init()`.
- **Drivers existants** : Knex utilise `sqlite3` et `mysql2` comme peer dependencies — les deux étaient déjà installés.

L'`InMemoryRepository` est conservé pour les tests unitaires du service (pas besoin de base de données).

La configuration est centralisée dans `knexConfig.ts` qui choisit le dialect selon `MYSQL_HOST` (même logique qu'avant, mais en un seul endroit).

## Conséquences

- Un seul `KnexRepository` au lieu de deux classes séparées — moins de code, moins de bugs
- Les migrations sont versionnées dans `src/migrations/` — on peut faire évoluer le schéma de façon traçable
- Le code passe de callbacks wrappés en Promises à du vrai async/await natif
- Le CLI `npx knex` est disponible pour lancer les migrations manuellement si besoin
- On garde la compatibilité avec les Docker secrets (`MYSQL_HOST_FILE`, etc.)
