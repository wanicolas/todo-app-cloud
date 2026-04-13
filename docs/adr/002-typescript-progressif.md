# ADR-002 : Migration TypeScript progressive

**Date** : avril 2026
**Statut** : Accepté

## Contexte

L'app d'origine est en JavaScript pur (CommonJS côté backend, ESM côté client). Le sujet demande de passer en TypeScript mais sans tout casser d'un coup — l'app doit rester fonctionnelle à chaque étape.

On avait déjà mis en place les tests avant de commencer la migration (étape 2 du processus de refonte), ce qui nous donne un filet de sécurité.

## Décision

- `allowJs: true` dans les deux tsconfig — les .js et .ts coexistent
- `strict: false` — on type progressivement, pas de big bang
- Backend : renommage .js → .ts fichier par fichier, ajout des types Request/Response et d'une interface TodoItem
- Client : renommage .jsx → .tsx, remplacement des PropTypes par des interfaces TypeScript
- Les tests restent en .js côté backend (via ts-jest qui transpile les imports .ts)

## Conséquences

- Le code compile et les tests passent à chaque étape de la migration
- Il reste des `any` dans la couche persistence (sqlite3/mysql2 n'ont pas de types très précis)
- On pourra activer `strict: true` plus tard quand tout sera typé proprement
- `tsx` remplace `ts-node` pour le dev car ts-node crashait dans Docker avec TypeScript 6
