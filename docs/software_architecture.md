# Architecture Logicielle Interne des Microservices

Pour garantir la maintenabilité, la robustesse et la testabilité, les microservices backend (`backend` et `auth`) ont été architecturés selon le modèle en **trois couches** couplé à un principe d'**injection de dépendances manuelle** (sans framework lourd).

---

## Structure en Trois Couches (Three-Tier Architecture)

Chaque service métier est séparé de manière hermétique en trois niveaux de responsabilité :

```
Requête HTTP  ──> [ Couche de Présentation (Routes/Controllers) ]
                                      │
                                      ▼
                  [ Couche Domaine (Service Métier) ]
                                      │
                                      ▼
                  [ Couche de Persistance (Repository) ]  ──> Base de données MySQL
```

### La Couche Présentation (Routes & Controllers)

- **Rôle** : Réceptionner les flux HTTP, valider les paramètres entrants (body, query, headers), déléguer l'exécution à la couche domaine, et formater la réponse (JSON, codes de statut HTTP : 200, 201, 400, 401, 403, 404, 500).
- **Structure** : Dans les fichiers sous `src/routes/`, les routeurs Express sont modélisés comme des factories (fonctions prenant le service en argument et retournant le routeur Express). Cela permet d'isoler Express des autres couches.

### C. La Couche Domaine (Service)

- **Rôle** : Contenir la logique métier centrale de l'application (validation de règles d'affaires, calculs, génération d'identifiants uniques UUID, orchestration des flux métier).
- **Indépendance** : La couche domaine n'a aucune connaissance d'Express (elle ne manipule ni objets `req` ou `res`, ni codes HTTP) et aucune connaissance directe de la base de données physique (elle manipule une interface abstraite de persistance).

### D. La Couche de Persistance (Repository)

- **Rôle** : Interagir avec les bases de données SQL via le query-builder **Knex.js** (écriture des requêtes SELECT, INSERT, UPDATE, DELETE).
- **Abstraction par Interface** : La persistance implémente une interface TypeScript stricte (par exemple, `TodoRepository` dans `backend/src/types.ts`). Le service ne dépend que de cette interface.

---

## Injection de Dépendances Manuelle (DI)

L'injection de dépendances consiste à passer à un objet ses collaborateurs (dépendances) lors de sa construction plutôt qu'il ne les instancie lui-même.

### Justification technique

- **Testabilité** : Permet de tester la logique métier du service en lui passant un dépôt factice en mémoire (`InMemoryRepository`) sans dépendre d'une base de données active (évite les mocks globaux de modules Jest qui rendent le code fragile).
- **Évolutivité** : Permet de changer d'implémentation de stockage (ex: passer d'un fichier plat à MySQL) sans modifier une seule ligne de code de la logique métier.

### Câblage au démarrage (Bootstrapping)

Le point d'entrée de l'application (`index.ts`) orchestre la création des instances dans l'ordre de leurs dépendances. Voici comment s'effectue le câblage dans `backend/src/index.ts` :

```typescript
// 1. Initialisation de la connexion Knex (Base de données)
const dbConfig = getKnexConfig();
const dbConnection = knex(dbConfig);

// 2. Instanciation du Repository (MySQL) avec la connexion SQL
const repository = new KnexRepository(dbConfig);

// 3. Instanciation du Service Métier avec injection du Repository
const service = new TodoService(repository);

// 4. Lancement de l'application Express avec injection du Service dans les contrôleurs
const app = createApp(service);
app.listen(port, () => { ... });
```

---

## Versioning et Migrations SQL de la Base de Données

Pour répondre aux exigences de maintenabilité et de reproductibilité des environnements, la structure de la base de données est versionnée à l'aide des **migrations Knex.js** sous `src/migrations/`.

- **Automatisation** : Lors du démarrage d'un conteneur en staging ou en production, le microservice exécute automatiquement les migrations en attente (`await db.migrate.latest()`). Aucun script SQL manuel n'est requis sur le serveur.
- **Historique** : Les modifications de schéma (ajout de la colonne `user_id` pour la sécurité multi-utilisateur) sont ainsi tracées au même titre que le code applicatif dans Git.
