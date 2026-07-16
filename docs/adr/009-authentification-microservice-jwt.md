# ADR-009 : Authentification en microservice séparé avec JWT

**Date** : avril 2026  
**Statut** : Dépassé (Superseded) par [ADR-015](015-sessions-http-only-esmodules.md)

## Contexte

L'issue #16 (`epic:securite`) demande d'ajouter un CRUD de compte usager conforme RGPD ainsi que l'authentification et l'autorisation, **en tant que microservice « à part » avec sa propre base de données**. Jusqu'ici l'application était composée de deux services (front React + back Express) et tous les endpoints `/api/*` étaient publics : la table `todo_items` n'avait aucune notion de propriétaire.

## Décision

### Un vrai microservice `auth/`

On crée un service `auth/` autonome, avec **la même stack** que le backend (Express 5 + TypeScript + Knex), son **propre conteneur** et sa **propre base MySQL** (`mysql-auth`). Il est routé par Traefik sur `/api/auth/*` (priorité supérieure à la règle `/api` du backend). L'application devient donc un trio de microservices : **front / back / auth**.

On calque volontairement la structure du backend (pattern service/repository, migrations Knex, tests Jest + supertest, Dockerfile multi-stage, pipeline CI dédiée) pour rester cohérent et réutiliser les conventions du projet.

### JWT signé en HS256 avec secret partagé

L'authentification repose sur des **JSON Web Tokens** (`jsonwebtoken`), signés en **HS256** avec un secret partagé `JWT_SECRET`. Le service auth émet les tokens ; le backend todo **vérifie lui-même la signature** avec le même secret, sans appel réseau au service auth à chaque requête.

- **HS256 (secret partagé)** plutôt que **RS256/JWKS** : pour un projet à trois services internes, le secret partagé est plus simple à mettre en place et à démontrer, sans serveur d'exposition de clés publiques. RS256 reste une évolution possible si les services devaient être exposés à des tiers.
- **Vérification locale** plutôt qu'un endpoint `/verify` : évite un couplage fort et une latence réseau sur chaque appel API.

Les mots de passe sont hachés avec **bcrypt** (`bcryptjs`). Le service ne renvoie jamais le hash.

### OAuth2 différé

L'issue mentionne OAuth2. Pour cette itération on livre **JWT seul** (inscription/login email + mot de passe). OAuth2 (login social ou serveur d'autorisation) est noté comme évolution future : l'architecture en microservice isolé le permet sans refonte.

### Todos privés par utilisateur

La table `todo_items` reçoit une colonne `user_id` (migration Knex, nullable pour une migration douce). Le service et le repository todo sont portés par `userId` : chaque utilisateur ne voit et ne manipule que ses propres todos. Le middleware `requireAuth` (présent dans les deux services) extrait l'`userId` du JWT et l'attache à la requête.

### CRUD de compte RGPD complet

Le service expose : inscription, login, consultation du profil (`GET /me`), modification (email / mot de passe), **suppression de compte** (droit à l'oubli) et **export des données** (portabilité, `GET /me/export`).

## Conséquences

- Architecture réellement distribuée : trois services déployables indépendamment (Compose + manifests Kubernetes + pipeline CI `ci-auth`).
- Le backend todo n'a aucune dépendance d'exécution vers le service auth : il lui suffit de partager `JWT_SECRET`.
- Le secret JWT est en clair dans `compose.yaml`/`config.yaml` pour le dev ; en production il doit provenir d'un secret Kubernetes (jamais commité ailleurs que comme placeholder dans `.env.example`).
- Les tests front et E2E ont été adaptés : l'application est désormais protégée (redirection vers `/login`), et chaque test E2E s'inscrit avec un compte frais isolé.
- OAuth2 et la rotation de clés (RS256/JWKS) restent ouverts comme évolutions.
