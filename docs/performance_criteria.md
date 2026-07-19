# Critères de Performance et de Qualité Logicielle

Ce chapitre définit les exigences et critères mesurables en termes de performance et de qualité logicielle pour le projet **Todo App Cloud**. Il décrit également la gestion des environnements cloud distincts (Staging, Production) et la configuration Helm associée pour orchestrer les déploiements AKS de manière sécurisée et économique.

---

## Critères de Performance et SLA (Service Level Agreements)

L'application étant hébergée dans un environnement Cloud distribué (Kubernetes / AKS), elle doit répondre à des critères de rapidité et de tolérance aux pannes strictes. Les seuils de performance retenus (SLA) sont les suivants :

| Indicateur (Metric)                | Seuil Cible (SLA) | Justification                                                                                                                                   |
| :--------------------------------- | :---------------: | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Temps de réponse p(95)**         |   **< 300 ms**    | 95% des requêtes HTTP (hors requêtes lourdes d'export) doivent être traitées en moins de 300ms pour garantir une expérience utilisateur fluide. |
| **Taux d'échec des requêtes**      |     **< 1 %**     | Moins de 1% des appels API doivent renvoyer des codes d'erreur HTTP 5xx (erreurs serveurs) sous charge normale.                                 |
| **Démarrage à froid des services** | **< 5 secondes**  | Permet une mise à l'échelle automatique rapide (Autoscaling) par Kubernetes pour répondre aux pics de trafic.                                   |

_Note : Le centile p(95) est utilisé à la place de la moyenne car il est beaucoup plus représentatif de l'expérience réelle des utilisateurs (il exclut les valeurs aberrantes mais intègre les ralentissements)._

---

## Protocole de Test de Charge (k6)

Afin de valider ces critères, un script de test de charge automatisé a été développé avec l'outil **k6** (voir [k6-load-test.js](../performance/k6-load-test.js)).

### Scénario du Test de Charge

Le test simule des vagues d'utilisateurs simultanés effectuant un parcours applicatif complet :

1.  **Consultation publique** : Requête sur le message d'accueil API (`GET /api/greeting`).
2.  **Création de session** : Inscription d'un nouvel utilisateur (`POST /api/auth/register`) pour obtenir un jeton JWT.
3.  **Gestion de tâches** : Création d'une tâche personnelle (`POST /api/items`) sous authentification JWT.
4.  **Lecture** : Récupération de sa liste de tâches (`GET /api/items`).
5.  **Droit à l'oubli (RGPD)** : Suppression de la tâche (`DELETE /api/items/:id`) puis suppression définitive du compte utilisateur (`DELETE /api/auth/me`) pour nettoyer la base.

### Profil de Charge (Stages)

- **Ramp-up (0 à 10s)** : Montée progressive de 0 à 5 utilisateurs virtuels simultanés (VUs) pour tester le démarrage à froid et la mise en cache.
- **Stress léger (10s à 30s)** : Transition de 5 à 15 VUs simultanés.
- **Maintien (30s à 50s)** : Palier de charge stable à 15 VUs simultanés pour détecter les fuites de mémoire.
- **Ramp-down (50s à 60s)** : Descente progressive vers 0 VU.

### Seils automatiques (Thresholds k6)

Le script intègre directement les assertions de performance dans ses options :

```javascript
thresholds: {
    http_req_duration: ['p(95)<300'], // Temps de réponse
    http_req_failed: ['rate<0.01'],    // Taux d'erreur
}
```

Si l'un des critères n'est pas respecté lors de l'exécution, k6 renvoie un code de sortie en erreur, ce qui permet de bloquer un déploiement en production via la pipeline CI/CD si une régression de performance est détectée.

### Exécution des Tests de Charge

Le test de charge peut être exécuté de deux manières (l'application doit être lancée et accessible au préalable) :

#### Avec l'outil k6 installé localement

Si `k6` est installé sur votre poste de travail (via `brew install k6`, `choco install k6` ou `apt install k6`) :

```bash
# Lancer le test sur l'URL locale par défaut (localhost:3080)
k6 run performance/k6-load-test.js

# Lancer le test sur une URL spécifique (ex: staging ou production Azure)
k6 run -e TARGET_URL=https://mon-app.azurewebsites.net performance/k6-load-test.js
```

#### Sans installation locale (via Docker)

Il est possible d'exécuter k6 à l'aide de son image officielle Docker sans avoir à l'installer localement :

Sur **Linux** (avec réseau partagé pour accéder à localhost) :

```bash
docker run --rm --network host -i grafana/k6 run - <performance/k6-load-test.js
```

Sur **macOS et Windows** (avec redirection d'hôte) :

```bash
docker run --rm -i grafana/k6 run -e TARGET_URL=http://host.docker.internal:3080 - <performance/k6-load-test.js
```

---

## Critères de Qualité Logicielle

La qualité du code et du produit est assurée par un ensemble d'outils automatisés intégrés à l'environnement de développement et de test :

### Analyse Statique et Standardisation

- **TypeScript** : Assure la sécurité du typage et évite les erreurs d'exécution silencieuses.
- **ESLint** : Valide le respect des conventions de codage et des règles de sécurité (ex. détection des variables inutilisées, injections potentielles).
- **Prettier** : Formate automatiquement le code pour garantir une lecture homogène du dépôt.

### Couverture de Test (Harnais)

- **Backend & Auth (Jest)** : Tests unitaires de logique métier et tests d'intégration supertest. Couverture mesurable via `npm run test:coverage`.
- **Frontend (Vitest)** : Tests de rendu et d'interaction des composants React.
- **Bout en bout (Playwright)** : Validation des parcours métiers critiques.

### Sécurité logicielle (OWASP & Vulnerability Scanning)

- **Trivy Security Scanning** : Intégration d'un scanneur d'images de conteneurs pour identifier les failles du système d'exploitation de base ou des dépendances avant la mise en production.

---

## Conception du Harnais de Tests Unitaires & d'Intégration (C2.2.2)

Le harnais de test automatisé a été conçu pour s'assurer du bon fonctionnement fonctionnel des microservices tout en prévenant les risques de régression lors des livraisons de code (C2.2.2). 

### 1. Stratégie d'Isolation et Environnement Éphémère

Afin de garantir que chaque cas de test s'exécute dans un état propre, sans dépendance réseau ou pollution de données (effets de bord entre tests exécutés en parallèle) :
- **Base de données en mémoire** : Pour les tests de logique métier (`TodoService`, `AuthService`), la connexion s'appuie sur le moteur **SQLite3 en mémoire (`:memory:`)**.
- **Cycle de vie des données (Hooks)** : 
  - Le crochet `beforeEach` réinitialise la structure de la table par migration et vide le contenu.
  - Le crochet `afterEach` effectue la fermeture des ressources (Graceful Teardown).
  - Le crochet `afterAll` détruit l'instance éphémère de connexion SQL.

---

### 2. Illustration d'un Cas de Test Unitaire (Jest)

Plutôt que d'exposer la totalité du harnais, nous présentons ici l'un des scénarios les plus critiques de notre suite de tests : la vérification de l'isolation logique des données entre utilisateurs. Ce test garantit qu'un utilisateur A ne peut en aucun cas lire ou interagir avec les données appartenant à un utilisateur B.

Le test utilise la structure standardisée **AAA (Arrange, Act, Assert)** :

```javascript
const { TodoService } = require('../../src/service/TodoService');
const { KnexRepository } = require('../../src/repository/KnexRepository');
const { getKnexConfig } = require('../../src/repository/knexConfig');

const USER = 'user-1';
const OTHER_USER = 'user-2';
let service;

beforeEach(async () => {
    // Initialisation éphémère pour chaque test
    const repository = new KnexRepository(getKnexConfig());
    service = new TodoService(repository);
    await service.init();
});

test('a user cannot see another user items', async () => {
    // 1. ARRANGE (Préparation) : L'utilisateur B crée une tâche privée
    await service.addItem(OTHER_USER, 'Tâche Secrète');

    // 2. ACT (Action) : L'utilisateur A tente de lister ses tâches
    const items = await service.getAllItems(USER);

    // 3. ASSERT (Assertion) : On valide que la liste pour A est strictement vide
    expect(items).toEqual([]);
});
```

### 3. Couverture de Code (Code Coverage)

Grâce à cette suite de tests, nous mesurons la couverture du code via l'outil de rapport intégré à Jest (`c8` / `istanbul`). Elle atteint **plus de 90 %** sur les fichiers de services et repositories, garantissant ainsi qu'aucun chemin critique (gestion d'erreurs, injections) n'est laissé sans validation automatisée.

