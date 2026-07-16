# Todo App Cloud

Refonte cloud-native de l'application todo list de Docker ([getting-started-todo-app](https://github.com/docker/getting-started-todo-app)).

Projet réalisé dans le cadre du module "Développer pour le cloud" — M2 Dev Full Stack.

## Stack technique

- **Frontend** : React 19, TypeScript, Vite, React Bootstrap, React Router
- **Backend** : Node.js 22, Express 5, TypeScript
- **Auth** : microservice dédié (Express 5, TypeScript, JWT HS256, bcrypt) avec sa propre base
- **Base de données** : MySQL 8.0.21 (SQLite en fallback local) — une instance par service de données
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
# Backend — 29 tests (SQLite automatique)
docker compose run --build --rm -e MYSQL_HOST= backend npm test

# Client — 23 tests
docker compose run --build --rm client npm test
```

### Via Node.js local

```bash
# Backend (Jest) — 29 tests
cd backend
npm install --ignore-scripts   # pour éviter la compilation native sqlite3 si make est manquant
npm test
npm run test:coverage          # avec rapport de couverture

# Auth (Jest) — 23 tests
cd auth
npm install --ignore-scripts
npm test
npm run test:coverage

# Client (Vitest) — 23 tests
cd client
npm install
npm test
npm run test:coverage          # avec rapport de couverture
```

### E2E (Playwright) — 8 tests

Les tests E2E nécessitent que l'app tourne via Docker Compose et Node.js local.

```bash
docker compose up -d           # démarrer les services en arrière-plan
npm install                    # installer les dépendances racine (Playwright)
npx playwright install chromium
npm run test:e2e               # lancer les 8 tests
npm run test:e2e:headed        # avec navigateur visible
docker compose down -v         # arrêter et nettoyer après les tests
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

## CI/CD & DevSecOps

L'architecture s'appuie sur 2 pipelines unifiés dans `.github/workflows/` :

| Pipeline | Déclencheur | Contenu |
| --- | --- | --- |
| **ci.yml** | push/PR sur n'importe quelle branche | Orchestration intelligente (Lint/Typecheck → Build Docker avec cache Buildx → Scans Trivy → Tests E2E Playwright). |
| **cd.yml** | push sur `develop` ou tag `v*` | Build/Scan matriciel (parallèle) des images → Push ACR → Déploiement Helm sur AKS (OIDC sans mot de passe). |

### Cloud & Kubernetes Hardening (Azure / AKS)

L'infrastructure a été durcie pour respecter les standards **Zero Trust** et **DevSecOps** :
- **Isolation Réseau** : La base de données MySQL est isolée dans un réseau privé (Azure VNet + Private DNS Zone) et n'est plus accessible depuis Internet.
- **Gestion des Secrets** : Azure Key Vault utilise désormais **Azure RBAC** avec l'identité CSI du cluster, et la protection anti-suppression (purge protection) est activée.
- **Sécurité des Pods** : Les conteneurs tournent en mode **Non-Root** (`runAsNonRoot: true`) et sans escalade de privilèges.
- **Pare-feu Kubernetes** : Des **NetworkPolicies** stricts sont appliqués. Seul le reverse-proxy (Nginx) peut recevoir du trafic public et router vers les microservices.
- **Haute Disponibilité** : Tous les services sont configurés avec **HPA** (autoscaling dynamique) et **PDB** (Pod Disruption Budgets) pour garantir le Zéro-Downtime lors des maintenances Azure.

## Variables d'environnement

Voir `.env.example` pour la liste complète.

| Variable             | Description                                        | Défaut                 |
| -------------------- | -------------------------------------------------- | ---------------------- |
| `MYSQL_HOST`         | Hôte MySQL                                         | — (si absent → SQLite) |
| `MYSQL_USER`         | Utilisateur MySQL                                  | —                      |
| `MYSQL_PASSWORD`     | Mot de passe MySQL                                 | —                      |
| `MYSQL_DB`           | Nom de la base                                     | —                      |
| `SQLITE_DB_LOCATION` | Chemin du fichier SQLite                           | `/etc/todos/todo.db`   |
| `JWT_SECRET`         | Secret partagé HS256 (auth signe, backend vérifie) | `dev-insecure-secret`  |
| `JWT_EXPIRES_IN`     | Durée de validité des tokens                       | `1h`                   |
| `NODE_ENV`           | Environnement Node                                 | `development`          |

Docker Compose configure ces variables automatiquement pour les services backend et auth.
Le service `auth` se connecte à sa propre instance MySQL (`mysql-auth`, base `auth`).

## Authentification

L'accès à l'application requiert un compte. Le microservice `auth` expose, sous `/api/auth` :

| Méthode  | Endpoint              | Accès  | Description                                               |
| -------- | --------------------- | ------ | --------------------------------------------------------- |
| `POST`   | `/api/auth/register`  | public | Création de compte (email + mot de passe), renvoie un JWT |
| `POST`   | `/api/auth/login`     | public | Connexion, renvoie un JWT                                 |
| `GET`    | `/api/auth/me`        | JWT    | Profil de l'utilisateur courant                           |
| `PUT`    | `/api/auth/me`        | JWT    | Modifier email / mot de passe                             |
| `DELETE` | `/api/auth/me`        | JWT    | Suppression de compte (droit à l'oubli, RGPD)             |
| `GET`    | `/api/auth/me/export` | JWT    | Export des données du compte (portabilité, RGPD)          |

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
│   ├── spec/                 # Tests Jest (unitaires + intégration)
│   └── Dockerfile            # Multi-stage (dev, test, production)
├── client/                   # React SPA (TypeScript)
│   ├── src/
│   │   ├── components/       # Greeting, TodoListCard, AddNewItemForm, ItemDisplay
│   │   ├── pages/            # Login, Register (RGPD), Account (RGPD)
│   │   ├── auth/             # AuthContext, ProtectedRoute
│   │   └── api/              # Wrapper fetch (injection du JWT)
│   ├── src/test/             # Setup Vitest
│   └── Dockerfile            # Multi-stage (dev, build, production non-root)
├── e2e/                      # Tests Playwright (E2E)
├── k8s/todo-app/             # Chart Helm unifié (client, backend, auth, proxy, mysql-local, secrets CSI)
├── .github/workflows/        # CI GitHub Actions (5 pipelines, scan Trivy adapté)
├── docs/
│   ├── adr/                  # 11 ADR (décisions techniques)
│   ├── context_map.md        # Cartographie des contextes métier
│   ├── glossaire.md          # Glossaire technique des termes
│   ├── deployment_procedure.md # Guide de déploiement pas-à-pas (Local & Azure AKS)
│   ├── runbooks.md           # Fiches réflexes et runbooks d'exploitation
│   └── *.pdf                 # Sujet et grille d'évaluation
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

Les Architecture Decision Records sont dans [`docs/adr/`](docs/adr/)
