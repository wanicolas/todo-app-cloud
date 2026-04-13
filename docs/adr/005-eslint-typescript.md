# ADR-005 : Configuration ESLint séparée backend/client

**Date** : avril 2026
**Statut** : Accepté

## Contexte

Le client avait déjà ESLint 8 avec les plugins React (react, react-hooks, react-refresh). Le backend n'avait rien. On devait ajouter le support TypeScript des deux côtés.

## Décision

- **Backend** : ESLint 10 avec le nouveau format flat config (`eslint.config.mjs`) + `typescript-eslint`. On est parti de zéro donc autant prendre la dernière version.
- **Client** : on a gardé ESLint 8 (legacy `.eslintrc.cjs`) et ajouté `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin`. Pas de raison de tout migrer vers ESLint 10 quand ça marchait déjà.

Les deux sont configurés avec `--max-warnings 0` (zéro tolérance).

`no-explicit-any` est désactivé des deux côtés car la migration TypeScript est progressive et il reste des `any` dans la couche persistence.

## Conséquences

- Deux configs ESLint différentes (flat vs legacy) — c'est pas idéal mais ça évite de casser les plugins React existants
- Le lint passe sans erreur des deux côtés
- Le lint est intégré dans la CI (première étape de chaque pipeline)
