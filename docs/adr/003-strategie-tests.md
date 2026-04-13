# ADR-003 : Stratégie de tests à 3 niveaux

**Date** : avril 2026
**Statut** : Accepté

## Contexte

L'app d'origine avait quelques tests Jest pour les routes backend, mais rien pour le frontend et pas de tests end-to-end. Le sujet demande des tests unitaires, fonctionnels, et E2E avec couverture de code.

## Décision

3 niveaux de tests, chacun avec l'outil adapté à son écosystème :

**Backend (Jest)** :
- Tests unitaires des routes avec mocks de la persistence
- Tests d'intégration avec supertest + vraie base SQLite (pas de mock)
- On a extrait `app.js` de `index.js` pour pouvoir importer l'app Express dans les tests sans démarrer le serveur

**Frontend (Vitest)** :
- Tests unitaires des 4 composants React avec React Testing Library
- Mocks de `fetch` pour isoler les composants de l'API
- Vitest plutôt que Jest car c'est natif Vite, zéro config supplémentaire

**E2E (Playwright)** :
- 6 scénarios couvrant tous les parcours utilisateur (ajout, toggle, suppression, état vide)
- Tourne contre l'app complète via Docker Compose
- Chromium uniquement (suffisant pour un projet scolaire)

## Conséquences

- 17 tests backend + 13 tests frontend + 6 tests E2E = 36 tests au total
- Les tests d'intégration supertest ont nécessité de refactorer index.js (extraction de app.js)
- Les E2E dépendent de Docker Compose, ils ne tournent pas sans
- La couverture est mesurable des deux côtés (`npm run test:coverage`)
