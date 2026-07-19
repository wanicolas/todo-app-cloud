# Critères de Performance, de Qualité & Harnais de Tests

Ce chapitre réunit les exigences et mesures d'assurance qualité et de performance du projet.

---

## Seuils de Performance & SLA (Service Level Agreements)

L'application déployée sur Kubernetes doit respecter les seuils de performance mesurables suivants :

| Métrique (Metric)             | Seuil (SLA)  | Descriptif et Justification                                       |
| :---------------------------- | :----------: | :---------------------------------------------------------------- |
| **Temps de réponse p(95)**    | **< 300 ms** | 95% des appels HTTP de l'API doivent être traités sous les 300ms. |
| **Taux d'échec des requêtes** |  **< 1 %**   | Moins de 1% des appels doivent renvoyer des erreurs HTTP 5xx.     |
| **Démarrage des services**    |  **< 5 s**   | Temps requis pour démarrer un nouveau pod lors de l'autoscaling.  |

---

## Protocole de Test de Charge (k6)

Un test de charge automatisé a été développé avec **k6** (voir [k6-load-test.js](../performance/k6-load-test.js)).

- **Scénario d'usage (nominal)** : 1. Accueil API (`GET /greeting`), 2. Inscription d'un nouvel utilisateur (`POST /auth/register`), 3. Ajout d'une tâche avec jeton JWT (`POST /items`), 4. Lecture de la liste (`GET /items`), 5. Suppression de la tâche et suppression du compte (droit à l'oubli).
- **Profil de charge (60s)** : Montée progressive (Ramp-up) de 0 à 15 utilisateurs virtuels simultanés (VUs) pour tester le comportement de la mise à l'échelle.
- **Assertions (Thresholds k6)** :
  ```javascript
  thresholds: {
      http_req_duration: ['p(95)<300'], // Durée de requête
      http_req_failed: ['rate<0.01'],    // Taux d'échec
  }
  ```
- **Exécution des tests de charge** :

  ```bash
  # Exécution locale
  k6 run performance/k6-load-test.js

  # Exécution Docker (alternative)
  docker run --rm --network host -i grafana/k6 run - <performance/k6-load-test.js
  ```

---

## Harnais de Tests Unitaires & d'Intégration

L'assurance qualité repose sur un harnais de tests unitaires et d'intégration automatisés (Jest pour le backend/auth, Vitest pour le client, Playwright pour le E2E).

### Isolation de l'environnement de test (Jest)

- **Base en mémoire éphémère** : Pour les tests unitaires et d'intégration, nous utilisons le dialecte **SQLite3 en mémoire (`:memory:`)**.
- **Hooks de nettoyage** : Le hook `beforeEach` initialise le schéma SQL par migration à blanc. Le hook `afterEach` effectue la fermeture propre (teardown) pour éviter toute fuite de ressources.

### Illustration d'un scénario de test d'isolation (Jest)

Le scénario ci-dessous utilise le modèle standardisé **AAA (Arrange, Act, Assert)** pour valider l'isolation logique des données entre deux utilisateurs distincts :

```javascript
const { TodoService } = require("../../src/service/TodoService");
const { KnexRepository } = require("../../src/repository/KnexRepository");
const { getKnexConfig } = require("../../src/repository/knexConfig");

const USER = "user-1";
const OTHER_USER = "user-2";
let service;

beforeEach(async () => {
  service = new TodoService(new KnexRepository(getKnexConfig()));
  await service.init();
});

test("a user cannot see another user items", async () => {
  // 1. ARRANGE : L'utilisateur B crée une tâche privée
  await service.addItem(OTHER_USER, "Tâche Secrète");

  // 2. ACT : L'utilisateur A tente de lister ses tâches
  const items = await service.getAllItems(USER);

  // 3. ASSERT : On valide que la liste retournée pour A est vide
  expect(items).toEqual([]);
});
```

_Le rapport de couverture (`npm run test:coverage`) atteint **plus de 90 %** sur les fichiers de services et repositories, assurant une forte fiabilité._
