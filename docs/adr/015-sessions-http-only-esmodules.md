# ADR-015 : Sécurisation Session (Cookies HttpOnly), ESModules et Mises à niveau Applicatives

**Date** : juillet 2026  
**Statut** : Accepté (Superpose et remplace [ADR-009](009-authentification-microservice-jwt.md))

## Contexte

La version initiale de l'application stockait les jetons JWT dans le `localStorage` du navigateur. Bien que simple à implémenter, ce stockage expose les sessions à un vol de jeton par exfiltration de données en cas de faille de type XSS (Cross-Site Scripting).

De plus, l'architecture logicielle s'appuyait sur des standards obsolètes ou des modules externes lourds : l'utilisation historique de la syntaxe CommonJS (`require` / `module.exports`), l'injection de dépendances non typées (`any`), le hachage logiciel lent avec `bcryptjs` et l'utilisation du package tiers externe `uuid`.

## Décision

Nous avons procédé à une refonte complète de l'architecture logicielle et de sécurité :

1. **Sécurisation par Cookies HttpOnly** :
   - **Frontend** : Purge complète du stockage en `localStorage`. Le client effectue ses appels d'API avec l'option `credentials: 'include'` de `fetch` pour transmettre automatiquement les informations de session.
   - **Backend & Auth** : Les routes de connexion (`/login`) et d'inscription (`/register`) injectent désormais le jeton JWT directement dans un cookie sécurisé : `Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Strict`.
   - **Middleware d'authentification** : Refonte de [requireAuth.ts](../../backend/src/middleware/requireAuth.ts) pour extraire le jeton non plus des en-têtes `Authorization: Bearer` mais du cookie à l'aide de `cookie-parser`.
2. **Transition vers les ESModules (ES6)** :
   - Conversion intégrale du backend et du microservice d'authentification pour utiliser les imports/exports natifs (`import`/`export`) à la place de CommonJS.
3. **Type Safety & Injection de Dépendances** :
   - Remplacement de l'utilisation de `any` par des interfaces TypeScript explicites et fortement typées pour le couplage du `TodoService` et de l'injection du `TodoRepository`.
4. **Protections des En-têtes HTTP (Helmet)** :
   - Intégration du middleware `helmet` dans l'application Express pour configurer automatiquement des en-têtes HTTP sécurisés contre le Clickjacking, le reniflage de MIME, et renforcer la Content Security Policy (CSP).
5. **Modernisation et Performances des Modules** :
   - Migration vers le module natif **`bcrypt`** (compilé en C++) pour des temps de hachage de mot de passe plus performants et une réduction de l'épuisement de CPU.
   - Remplacement du module externe `uuid` par l'API cryptographique native de Node 22 : **`crypto.randomUUID()`**.
   - Suppression de l'anti-pattern `InMemoryRepository.ts` au profit d'une base de données SQLite éphémère locale pour les suites de tests unitaires et d'intégration, garantissant un environnement de test proche de la production.

## Conséquences

- **Immunisation contre l'exfiltration XSS** : Le JavaScript du navigateur ne peut plus accéder aux jetons d'accès.
- **Codebase standardisée** : Alignement sur le standard moderne ESModules de Node.js.
- **Typage robuste** : Les incohérences de signatures de méthodes ou de couplage sont détectées dès la phase de build.
- **Performances accrues** : Le hachage natif et l'UUID natif économisent des cycles d'exécution processeur.
