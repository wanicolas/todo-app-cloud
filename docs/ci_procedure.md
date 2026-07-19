# Protocole d'Intégration Continue (CI) (C2.1.2)

Le protocole d'intégration continue est au cœur de notre démarche d'assurance qualité et de prévention des régressions (C2.1.2). Configuré via GitHub Actions dans [.github/workflows/ci.yml](file:///.github/workflows/ci.yml), il s'exécute automatiquement à chaque soumission de Pull Request ou push sur la branche principale `main`.

---

## Cycle de validation et "Merge Gates"

Pour garantir la stabilité du tronc commun, aucun développeur ne peut fusionner directement du code non validé. Le dépôt applique une politique stricte de **Merge Gates** (barrières de fusion) exigeant :

1. Que la pipeline d'intégration continue s'exécute avec succès (statut vert).
2. Que la couverture de test ne régresse pas.
3. Qu'aucune vulnérabilité critique de dépendance ou d'image conteneur ne soit introduite.

---

## Séquence détaillée d'intégration

Le workflow CI orchestre les validations de manière parallèle et progressive afin d'accélérer les retours (Fast Feedback) :

```
             ┌────────────── Push / Pull Request ──────────────┐
             │                                                 │
             ▼                                                 ▼
     [ Job: Backend ]                                  [ Job: Auth ]
 - Lint (ESLint)                                   - Lint (ESLint)
 - Typecheck (tsc)                                 - Typecheck (tsc)
 - Tests Jest (BDD MySQL éphémère)                 - Tests Jest (BDD MySQL éphémère)
             │                                                 │
             └───────────────────────┬─────────────────────────┘
                                     │ (Si succès)
                                     ▼
                           [ Job: Client (Front) ]
                        - Lint, Typecheck, Tests Vitest
                                     │
                                     ▼
                        ┌────────────┴────────────┐
                        │                         │
                        ▼                         ▼
               [ Job: Trivy Scan ]          [ Job: E2E Playwright ]
             - Build images Docker        - Build local compose dev
             - Scan CVE des conteneurs    - Démarrage stack Traefik
                                          - Exécution tests Playwright
```

### Étape 1 : Validation Statique (Linting et Typechecking)

Pour chaque composant (`backend`, `auth`, `client`), le pipeline installe les dépendances Node.js et exécute :

- **ESLint** : Pour détecter les erreurs de syntaxe, l'usage de variables obsolètes ou non définies, et faire respecter les standards de codage.
- **TypeScript (`tsc --noEmit`)** : Pour valider la cohérence et l'intégrité du typage statique à travers tout le projet.

### Étape 2 : Validation Dynamique (Harnais de Tests Unitaires et d'Intégration)

Les tests unitaires sont exécutés automatiquement :

- Les microservices `backend` et `auth` s'appuient sur des conteneurs MySQL de test démarrés à la volée en tant que services GitHub Actions pour valider les requêtes Knex réelles.
- Le client React exécute ses tests de composants via Vitest.

### Étape 3 : Construction et Scan de Sécurité des Conteneurs (Trivy)

Une fois le code validé, les Dockerfiles multi-stage de production sont compilés.
L'action **Trivy Vulnerability Scanner** analyse immédiatement les images compilées pour identifier :

- Les vulnérabilités du système d'exploitation de base (Debian/Alpine).
- Les packages ou dépendances logicielles obsolètes contenant des failles de sécurité connues (CVE).
  Si une faille de niveau `HIGH` ou `CRITICAL` sans patch existant est identifiée, le build est interrompu.

### Étape 4 : Tests de Bout en Bout Applicatifs (Playwright E2E)

Pour valider le comportement fonctionnel réel (parcours utilisateur) :

1. Une instance éphémère complète de l'application est démarrée via Docker Compose (incluant le Reverse Proxy Traefik, les deux bases de données MySQL de test, et les microservices backend, auth et front).
2. Un script d'attente s'assure que tous les endpoints HTTP répondent correctement.
3. Les tests **Playwright E2E** sont lancés en simulant des interactions réelles sur un navigateur Chromium sans tête (Headless) : inscription, connexion, création de tâche, complétion, suppression, et suppression définitive de compte RGPD.
4. Les résultats et vidéos de test sont archivés en tant qu'artefacts GitHub.
