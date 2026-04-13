# Todo App Cloud

Refonte cloud-native de l'application todo list de Docker ([getting-started-todo-app](https://github.com/docker/getting-started-todo-app)).

Projet réalisé dans le cadre du module "Développer pour le cloud" — M2 Dev Full Stack.

## Stack technique

- **Frontend** : React 19, TypeScript, Vite, React Bootstrap
- **Backend** : Node.js 22, Express 5, TypeScript
- **Base de données** : MySQL 9.3 (SQLite en fallback)
- **Proxy** : Traefik v3.6
- **Tests** : Jest, Vitest, Playwright
- **CI** : GitHub Actions (3 pipelines)

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js 22 (voir `.nvmrc`)

## Lancement

### Avec Docker (recommandé)

```bash
git clone https://github.com/wanicolas/todo-app-cloud.git
cd todo-app-cloud
docker compose up --watch
```

L'app est dispo sur http://localhost:3080

phpMyAdmin est accessible sur http://db.localhost:3080

### Sans Docker (dev local)

```bash
# Backend
cd backend
npm install
npm run dev

# Client (dans un autre terminal)
cd client
npm install
npm run dev
```

### Arrêter les services

```bash
docker compose down
```

## Tests

```bash
# Backend (Jest) — 17 tests
cd backend && npm test

# Frontend (Vitest) — 13 tests
cd client && npm test

# E2E (Playwright) — nécessite docker compose up
npm run test:e2e

# Coverage
cd backend && npm run test:coverage
cd client && npm run test:coverage
```

## Lint & Typecheck

```bash
cd backend && npm run lint && npm run typecheck
cd client && npm run lint && npm run typecheck
```

## CI/CD

3 pipelines GitHub Actions :

- **ci-backend** : lint, typecheck, format, build, tests — déclenché sur push/PR quand `backend/` change
- **ci-client** : lint, typecheck, format, build, tests — déclenché sur push/PR quand `client/` change
- **ci-e2e** : Docker Compose + Playwright — déclenché sur PR vers main uniquement

## Variables d'environnement

Voir `.env.example` pour la liste complète.

| Variable | Description | Défaut |
|---|---|---|
| `MYSQL_HOST` | Hôte MySQL | — |
| `MYSQL_USER` | Utilisateur MySQL | — |
| `MYSQL_PASSWORD` | Mot de passe MySQL | — |
| `MYSQL_DB` | Nom de la base | — |
| `SQLITE_DB_LOCATION` | Chemin du fichier SQLite (si pas de MySQL) | `/etc/todos/todo.db` |
| `NODE_ENV` | Environnement Node | `development` |

Si `MYSQL_HOST` n'est pas défini, l'app utilise automatiquement SQLite.

## Architecture du projet

```
.
├── backend/              # API Express (TypeScript)
│   ├── src/
│   │   ├── routes/       # Handlers API (CRUD items + greeting)
│   │   ├── persistence/  # Couche données (SQLite / MySQL)
│   │   └── types.ts      # Interfaces TodoItem, Persistence
│   └── spec/             # Tests Jest (unitaires + intégration)
├── client/               # React SPA (TypeScript)
│   ├── src/
│   │   └── components/   # Greeting, TodoListCard, AddNewItemForm, ItemDisplay
│   └── src/test/         # Setup Vitest
├── e2e/                  # Tests Playwright (E2E)
├── .github/workflows/    # CI GitHub Actions
├── docs/                 # Sujet, grille, ADR
└── compose.yaml          # Stack Docker (Traefik + backend + client + MySQL)
```

## Décisions techniques

Les ADR (Architecture Decision Records) sont dans [`docs/adr/`](docs/adr/).
