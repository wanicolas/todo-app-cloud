## Contexte : Le "Sprint MCO" et l'Observabilité

> **Note de contexte :** L'infrastructure Azure (AKS, Application Insights, Azure Monitor) de ce projet n'est pas maintenue en production permanente pour des raisons budgétaires (facturation à l'usage Azure). L'ensemble des configurations de supervision décrites ci-dessous a été déployé et validé fonctionnellement sur un environnement de staging dédié lors du "Sprint MCO", puis arrêté. Conformément aux modalités d'évaluation du Bloc 4 (*"mise en situation professionnelle réelle ou fictive"*), le présent dossier constitue une description technique complète et fidèle du système mis en place.

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

### Périmètre de Supervision et Cartographie des Sondes

Afin de structurer la surveillance, le périmètre de supervision a été formalisé dans la matrice suivante, couvrant l'ensemble des composants critiques de l'architecture :

| Composant | Sonde / Métrique | Seuil d'Alerte | Action Déclenchée |
| :--- | :--- | :--- | :--- |
| **Backend API (Express)** | Liveness Probe (`/api/health/live`) | 3 échecs consécutifs (30s) | Redémarrage automatique du Pod |
| | Readiness Probe (`/api/health/ready`) | 1 échec | Retrait du Pod du routage Ingress |
| | Temps de réponse HTTP (p95) | > 300ms sur 5 min | Alerte Sev.2 + Investigation |
| | Taux d'erreur HTTP 5xx | > 1% sur 5 min | Alerte Sev.1 + Astreinte |
| **Frontend (React SPA)** | Erreurs JavaScript (Sentry) | > 5 erreurs/min | Alerte Sev.2 via Slack |
| | Disponibilité (Health Check HTTP 200) | Échec pendant 2 min | Alerte Sev.1 + Astreinte |
| **Base de données MySQL** | Connexions actives | > 80% de `max_connections` | Alerte Sev.2 + Scaling pool |
| | Slow Queries (> 1s) | > 10 requêtes/min | Alerte Sev.3 + Revue requêtes |
| | Espace de stockage utilisé | > 85% du volume | Alerte Sev.1 + Extension disque |
| | Latence de réplication (si replica) | > 5s de retard | Alerte Sev.2 |
| **Cluster AKS (Nœuds)** | Utilisation CPU par nœud | > 80% sur 5 min | Autoscaling HPA / Alerte Sev.2 |
| | Utilisation RAM par nœud | > 85% sur 5 min | Alerte Sev.2 + Investigation OOM |
| | État des Pods (CrashLoopBackOff) | Détection immédiate | Alerte Sev.1 + Astreinte |
| **Certificats TLS** | Expiration du certificat Ingress | < 14 jours avant expiration | Alerte Sev.2 + Renouvellement |

### Critères de Qualité et Indicateurs de Performance (KPIs)

Les critères de qualité suivants ont été définis en adéquation avec la typologie de l'application (application web collaborative utilisée en journée, architecture microservices sur AKS) :

- **Disponibilité cible (SLA) :** 99.9% sur une fenêtre glissante de 30 jours, soit un budget d'indisponibilité maximal de ~43 minutes/mois.
- **Performance (Latence) :** Temps de réponse API p95 < 300ms et p99 < 500ms. Au-delà, dégradation perceptible de l'expérience utilisateur.
- **Fiabilité (Taux d'erreur) :** Taux d'erreurs HTTP 5xx < 0.1% en régime nominal. Le seuil d'alerte est fixé à 1% pour laisser une marge avant impact utilisateur significatif.
- **Saturation (Capacité) :** Utilisation CPU/RAM des nœuds maintenue sous 80% pour absorber les pics imprévus sans dégradation.

Ces indicateurs sont collectés par **Azure Monitor** (métriques d'infrastructure AKS et MySQL) et **Application Insights** (métriques applicatives : traces de requêtes, dépendances, exceptions). Les données sont consolidées dans un tableau de bord unifié permettant une vue temps réel de la santé du système.

### Modalités de Signalement

Lorsqu'un seuil critique est franchi, une alerte est déclenchée et classifiée selon trois niveaux de sévérité :

| Sévérité | Critère de déclenchement | Délai de réaction | Canal de notification |
| :--- | :--- | :--- | :--- |
| **Sev.1 (Critique)** | Indisponibilité totale, perte de données, CrashLoop | < 15 min | Webhook Teams/Slack + SMS astreinte |
| **Sev.2 (Majeure)** | Dégradation de performance, saturation partielle | < 1h | Webhook Teams/Slack |
| **Sev.3 (Mineure)** | Anomalie non bloquante, slow queries | Jour ouvré suivant | Notification e-mail |

Chaque alerte est accompagnée des logs et traces pertinents (ID de corrélation, Stacktrace, métriques contextuelles) pour accélérer le diagnostic par l'équipe d'astreinte.
