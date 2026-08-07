## Contexte : Le "Sprint MCO" et l'Observabilité

Lors de la validation initiale de l'architecture (Bloc 2), l'application disposait d'une base Cloud-Native solide mais dépourvue d'outils complets de Maintien en Condition Opérationnelle (MCO). Afin de garantir la disponibilité en production (Bloc 4), l'équipe a dédié un "Sprint MCO" entier pour implémenter une stack d'Observabilité à trois piliers (Front, Back, Infra).

## Processus de Mise à Jour des Dépendances (C4.1.1)

Le maintien à jour des composants logiciels est essentiel pour prévenir les failles de sécurité et bénéficier des dernières optimisations. Le processus s'appuie sur une démarche automatisée complétée par une validation humaine.

### Périmètre Logiciel Concerné

- **Backend & Auth (Node.js/Express) :** Dépendances définies dans `package.json` (ex: Knex, Bcrypt, Express).
- **Frontend (React) :** Bibliothèques UI et utilitaires.
- **Infrastructure (Docker) :** Images de base (ex: `node:22-alpine`).

### Fréquence et Automatisation (Dependabot)

Une analyse automatisée est effectuée chaque semaine (le lundi à 08h00) via **GitHub Dependabot** défini par le fichier de configuration `.github/dependabot.yml` :

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "08:00"
    open-pull-requests-limit: 10
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
```

L'outil génère automatiquement des _Pull Requests (PR)_ pour chaque dépendance périmée.
La CI exécute ensuite la suite de tests (unitaires et E2E). Les mises à jour correctives et mineures sont automatiquement fusionnées si la CI passe au vert. En revanche, les mises à jour majeures (qui peuvent introduire des _breaking changes_) nécessitent une validation et des tests manuels par l'équipe de développement.

![Exemple de Pull Request générée automatiquement par Dependabot avec checks CI validés](dependabot_PR.png)

### Gestion des Failles Critiques (CVE) & Évaluation d'Impact

En cas de détection d’une vulnérabilité de sévérité _HIGH_ ou _CRITICAL_, l'action Trivy intégrée au pipeline GitHub Actions bloque immédiatement le déploiement :

```yaml
- name: Run Trivy vulnerability scanner on Docker image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: "todo-app-backend:${{ github.sha }}"
    format: "table"
    exit-code: "1" # Échec du job si vulnérabilité trouvée
    ignore-unfixed: true
    vuln-type: "os,library"
    severity: "HIGH,CRITICAL"
```

L'équipe procède alors à une évaluation d'impact (analyse des paquets impactés, tests d'isolation) avant d'appliquer une montée de version corrective (Hotfix) sous 24 heures.

![Scan de sécurité de l'image Docker client échouant en CI suite à la détection de CVEs](trivy_scan_ci.png)

## Système de Supervision et d'Alerte (C4.1.2)

Pour garantir une disponibilité permanente (SLA 99.9%), l'application est supervisée à plusieurs niveaux de la pile technique.

### Sondes de Vie Kubernetes (Liveness & Readiness)

Le cluster AKS interroge en continu les microservices pour vérifier leur état via la configuration suivante dans le manifest Deployment (`deployment.yaml`) :

```yaml
spec:
  containers:
    - name: todo-backend
      image: todo-app-backend:v2.1.2
      ports:
        - containerPort: 3000
      livenessProbe:
        httpGet:
          path: /api/health/live
          port: 3000
        initialDelaySeconds: 15
        periodSeconds: 10
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /api/health/ready
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 5
```

- **Liveness Probe (`/api/health/live`) :** Vérifie l'état du processus applicatif Node.js (check mémoire/event loop sans dépendance externe). En cas de blocage ou d'échec successif (3 tentatives), le Pod est redémarré par Kubernetes.
- **Readiness Probe (`/api/health/ready`) :** Vérifie que le service est prêt à traiter du trafic en testant les connexions actives aux dépendances (Base de données MySQL, Cache). La séparation des deux sondes évite les pannes en cascade (_CrashLoopBackOff_) : si la BDD rencontre une micro-coupure, le Pod est simplement retiré des routes Ingress/Nginx le temps du rétablissement, sans subir de redémarrage destructeur.

### Métriques et Suivi des Performances

Nous utilisons **Azure Monitor** et **Application Insights** pour remonter les indicateurs clés :

- Taux d'utilisation CPU/RAM des Pods (pour déclencher l'autoscaling HPA).
- Temps de réponse HTTP (surveillance du seuil p95 < 300ms).
- Taux d'erreur HTTP 5xx.

### Modalités de Signalement

Lorsqu'un seuil critique est franchi (ex: Taux d'erreur > 1% sur 5 minutes), une alerte de sévérité 1 est déclenchée. Cette alerte est propagée via un Webhook vers le canal Microsoft Teams/Slack de l'équipe d'astreinte, accompagnée des logs pertinents pour accélérer le diagnostic.
