# ADR-004 : CI multi-pipeline

**Date** : avril 2026  
**Statut** : Dépassé (Superseded) par [ADR-014](file:///home/nicolaswalter/Ynov/Cloud/todo-app-cloud/docs/adr/014-ci-monorepo-merge-gate.md)

## Contexte

Le sujet demande un "processus de CI multi-pipeline". On a un backend et un client qui ont chacun leurs propres deps, tests et build. Pas de raison de tout lancer à chaque changement.

## Décision

3 pipelines GitHub Actions indépendants :

1. **ci-backend** — lint, typecheck, format-check, build, test:coverage
   - Se déclenche sur push/PR quand `backend/**` change
2. **ci-client** — lint, typecheck, format-check, build, test:coverage
   - Se déclenche sur push/PR quand `client/**` change
3. **ci-e2e** — docker compose up + Playwright
   - Se déclenche uniquement sur PR vers `main`

Les deux premiers filtrent par path (`paths: ['backend/**']` / `paths: ['client/**']`).
Le troisième ne tourne que sur les PR vers main car il est lourd (~5min avec le build Docker + MySQL).

## Conséquences

- Un changement backend ne relance pas les tests client et vice-versa
- L'E2E sert de gate final avant le merge en prod
- Le rapport Playwright est uploadé en artifact sur chaque run
- La CI a eu besoin de debug : le wait check doit vérifier `/api/greeting` (pas juste Traefik) et on a dû remplacer ts-node par tsx dans Docker
