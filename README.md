# Todo App Cloud

Refonte cloud-native de l'application todo list de Docker ([getting-started-todo-app](https://github.com/docker/getting-started-todo-app)).

Projet réalisé dans le cadre du module "Développer pour le cloud" — M2 Dev Full Stack.

## Stack technique

- **Frontend** : React 19, TypeScript, Vite, React Bootstrap, React Router
- **Backend** : Node.js 22, Express 5, TypeScript
- **Auth** : microservice dédié (Express 5, TypeScript, JWT HS256, bcrypt) avec sa propre base
- **Base de données** : MySQL 9.3 (SQLite en fallback local) — une instance par service de données
- **Query builder** : Knex.js (migrations versionnées, support multi-dialect)
- **Proxy** : Traefik v3.6
- **Tests** : Jest (backend + auth), Vitest (client), Playwright (E2E)
- **CI** : GitHub Actions (5 pipelines : backend, client, auth, E2E, Trivy)

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js 22 (voir `.nvmrc`)

## Lancement rapide

### Avec Docker (recommandé)

```bash
git clone https://github.com/wanicolas/todo-app-cloud.git
cd todo-app-cloud
cp .env.example .env          # optionnel, Docker Compose a ses propres valeurs
docker compose up --watch
```

- Application : http://localhost:3080
- phpMyAdmin : http://db.localhost:3080

### Arrêter les services

```bash
docker compose down
```

### Sans Docker (dev local, SQLite)

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev                    # API sur http://localhost:3000 (SQLite auto)

# Terminal 2 — Client
cd client
npm install
npm run dev                    # React sur http://localhost:5173
```

## Tests

### Via Docker (pas besoin de Node.js local)

Le flag `--build` force la reconstruction de l'image (utile si le code a changé) et `--rm` supprime le conteneur après exécution.

```bash
# Backend — 21 tests (SQLite automatique)
docker compose run --build --rm -e MYSQL_HOST= backend npm test

# Client — 13 tests
docker compose run --build --rm client npm test
```

### Via Node.js local

```bash
# Backend (Jest) — 21 tests
cd backend
npm install
npm test
npm run test:coverage          # avec rapport de couverture

# Client (Vitest) — 13 tests
cd client
npm install
npm test
npm run test:coverage          # avec rapport de couverture
```

### E2E (Playwright) — 6 tests

Les tests E2E nécessitent que l'app tourne via Docker Compose et Node.js local.

```bash
docker compose up -d           # démarrer les services en arrière-plan
npm install                    # installer les dépendances racine (Playwright)
npx playwright install chromium
npm run test:e2e               # lancer les 6 tests
npm run test:e2e:headed        # avec navigateur visible
docker compose down            # arrêter après les tests
```

## Lint, format et typecheck

```bash
# Backend
cd backend
npm run lint                   # ESLint (TypeScript)
npm run typecheck              # tsc --noEmit
npm run format-check           # Prettier

# Client
cd client
npm run lint                   # ESLint (TypeScript + React)
npm run typecheck              # tsc --noEmit
npm run format-check           # Prettier
```

## CI/CD

5 pipelines GitHub Actions dans `.github/workflows/` :

| Pipeline | Déclencheur | Contenu |
|---|---|---|
| **ci-backend** | push/PR sur `backend/` | lint, typecheck, format, build, tests avec couverture |
| **ci-client** | push/PR sur `client/` | lint, typecheck, format, build, tests avec couverture |
| **ci-auth** | push/PR sur `auth/` | lint, typecheck, format, build, tests avec couverture |
| **ci-e2e** | PR vers main/develop | Docker Compose + Playwright |
| **ci-trivy** | push main/develop | Scan de vulnérabilités Trivy sur les images Docker |

## Variables d'environnement

Voir `.env.example` pour la liste complète.

| Variable | Description | Défaut |
|---|---|---|
| `MYSQL_HOST` | Hôte MySQL | — (si absent → SQLite) |
| `MYSQL_USER` | Utilisateur MySQL | — |
| `MYSQL_PASSWORD` | Mot de passe MySQL | — |
| `MYSQL_DB` | Nom de la base | — |
| `SQLITE_DB_LOCATION` | Chemin du fichier SQLite | `/etc/todos/todo.db` |
| `JWT_SECRET` | Secret partagé HS256 (auth signe, backend vérifie) | `dev-insecure-secret` |
| `JWT_EXPIRES_IN` | Durée de validité des tokens | `1h` |
| `NODE_ENV` | Environnement Node | `development` |

Docker Compose configure ces variables automatiquement pour les services backend et auth.
Le service `auth` se connecte à sa propre instance MySQL (`mysql-auth`, base `auth`).

## Authentification

L'accès à l'application requiert un compte. Le microservice `auth` expose, sous `/api/auth` :

| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | public | Création de compte (email + mot de passe), renvoie un JWT |
| `POST` | `/api/auth/login` | public | Connexion, renvoie un JWT |
| `GET` | `/api/auth/me` | JWT | Profil de l'utilisateur courant |
| `PUT` | `/api/auth/me` | JWT | Modifier email / mot de passe |
| `DELETE` | `/api/auth/me` | JWT | Suppression de compte (droit à l'oubli, RGPD) |
| `GET` | `/api/auth/me/export` | JWT | Export des données du compte (portabilité, RGPD) |

Le JWT est signé en HS256 avec `JWT_SECRET`. Le backend todo vérifie lui-même la
signature (pas d'appel au service auth) et restreint chaque todo à son propriétaire
via la colonne `user_id`. Les endpoints `/api/items*` renvoient `401` sans token valide.

Une page **« Mon compte »** (`/account`) côté front permet à l'utilisateur d'exercer
ses droits RGPD : modifier email/mot de passe, **exporter ses données** (profil +
todos, en JSON), et **supprimer son compte**. La suppression purge d'abord les todos
(`DELETE /api/items`, backend) puis le compte (`DELETE /api/auth/me`, auth), pour ne
laisser aucune donnée orpheline.

## Architecture du projet

```
.
├── backend/                  # API Express (TypeScript)
│   ├── src/
│   │   ├── routes/           # Controllers (factories avec injection du service)
│   │   ├── service/          # TodoService (logique métier)
│   │   ├── repository/       # KnexRepository, InMemoryRepository + factory
│   │   ├── migrations/       # Migrations Knex (schéma BDD)
│   │   └── types.ts          # Interfaces TodoItem, TodoRepository
│   ├── spec/                 # Tests Jest (unitaires + intégration + service)
│   └── Dockerfile            # Multi-stage (dev, test, production)
├── auth/                     # Microservice d'authentification (TypeScript)
│   ├── src/
│   │   ├── routes/           # register, login, me (get/update/delete/export)
│   │   ├── service/          # AuthService (bcrypt + JWT)
│   │   ├── repository/       # KnexUserRepository, InMemoryUserRepository
│   │   ├── migrations/       # Migration table users
│   │   ├── middleware/       # requireAuth (vérification JWT)
│   │   └── types.ts          # Interfaces User, UserRepository
│   ├── spec/                 # Tests Jest (unitaires + intégration)
│   └── Dockerfile            # Multi-stage (dev, test, production)
├── client/                   # React SPA (TypeScript)
│   ├── src/
│   │   ├── components/       # Greeting, TodoListCard, AddNewItemForm, ItemDisplay
│   │   ├── pages/            # Login, Register, Account (RGPD)
│   │   ├── auth/             # AuthContext, ProtectedRoute
│   │   └── api/              # Wrapper fetch (injection du JWT)
│   ├── src/test/             # Setup Vitest
│   └── Dockerfile            # Multi-stage (dev, build)
├── e2e/                      # Tests Playwright (E2E)
├── k8s/                      # Manifests Kubernetes (todo-app, auth, mysql, mysql-auth)
├── .github/workflows/        # CI GitHub Actions (5 pipelines)
├── docs/
│   ├── adr/                  # 9 ADR (décisions techniques)
│   └── *.pdf                 # Sujet et grille d'évaluation
├── Dockerfile                # Image production (backend + client bundlé)
└── compose.yaml              # Stack Docker (Traefik + front + back + auth + MySQL ×2)
```

### Architecture backend (3 couches)

```
Routes (controllers)  →  TodoService  →  TodoRepository (interface)
                                              ├── KnexRepository (SQLite / MySQL via Knex.js)
                                              └── InMemoryRepository (tests)
```

L'injection de dépendances se fait par constructeur, sans framework. Le câblage est dans `index.ts` :
une factory choisit le repository selon l'environnement, puis construit le service et l'app.

## Décisions techniques (ADR)

Les Architecture Decision Records sont dans [`docs/adr/`](docs/adr/) :

1. [Git Flow](docs/adr/001-git-flow.md) — branches main/develop, features via PR
2. [TypeScript progressif](docs/adr/002-typescript-progressif.md) — migration incrémentale
3. [Stratégie de tests](docs/adr/003-strategie-tests.md) — 3 niveaux (unit, integ, E2E)
4. [CI multi-pipeline](docs/adr/004-ci-multi-pipeline.md) — pipelines séparés backend/client/E2E
5. [ESLint TypeScript](docs/adr/005-eslint-typescript.md) — configs séparées backend/client
6. [Architecture en couches](docs/adr/006-architecture-couches-di.md) — routes → service → repository + DI
7. [Knex.js](docs/adr/007-orm-knex.md) — query builder unifié, migrations versionnées
8. [Trivy](docs/adr/008-trivy-scan.md) — scan de vulnérabilités des images Docker
9. [Authentification microservice + JWT](docs/adr/009-authentification-microservice-jwt.md) — service auth séparé, JWT HS256, todos privés
