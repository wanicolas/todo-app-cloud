## 1.1. Contexte : Le "Sprint MCO" et l'Observabilité

Lors de la validation initiale de l'architecture (Bloc 2), l'application disposait d'une base Cloud-Native solide mais dépourvue d'outils complets de Maintien en Condition Opérationnelle (MCO). Afin de garantir la disponibilité en production (Bloc 4), l'équipe a dédié un "Sprint MCO" entier pour implémenter une stack d'Observabilité à trois piliers (Front, Back, Infra).

## 1.2. Processus de Mise à Jour des Dépendances (C4.1.1)

Le maintien à jour des composants logiciels est essentiel pour prévenir les failles de sécurité et bénéficier des dernières optimisations. Le processus s'appuie sur une démarche automatisée complétée par une validation humaine.

### 1.2.1. Périmètre Logiciel Concerné
- **Backend & Auth (Node.js/Express) :** Dépendances définies dans `package.json` (ex: Knex, Bcrypt, Express).
- **Frontend (React) :** Bibliothèques UI et utilitaires.
- **Infrastructure (Docker) :** Images de base (ex: `node:22-alpine`).

### 1.2.2. Fréquence et Automatisation (Dependabot)
Une analyse automatisée est effectuée chaque semaine (le lundi à 08h00) via **GitHub Dependabot**. L'outil génère automatiquement des *Pull Requests (PR)* pour chaque dépendance périmée. 
La CI exécute ensuite la suite de tests (unitaires et E2E). Si les tests sont au vert, la PR est fusionnée manuellement par l'équipe de développement.

### 1.2.3. Gestion des Failles Critiques (CVE)
En cas de détection d'une vulnérabilité de sévérité *HIGH* ou *CRITICAL* (via Trivy lors du déploiement ou Dependabot), une alerte immédiate est envoyée. Un correctif manuel (Hotfix) est appliqué et déployé sous 24 heures sans attendre le cycle hebdomadaire.

## 1.3. Système de Supervision et d'Alerte (C4.1.2)

Pour garantir une disponibilité permanente (SLA 99.9%), l'application est supervisée à plusieurs niveaux de la pile technique.

### 1.3.1. Sondes de Vie Kubernetes (Liveness & Readiness)
Le cluster AKS interroge en continu les microservices pour vérifier leur état :
- **Liveness Probe :** Vérifie que le processus Node.js n'est pas bloqué (`/api/health`). En cas d'échec successif (3 tentatives), le Pod est automatiquement redémarré.
- **Readiness Probe :** Vérifie que le service est prêt à recevoir du trafic (connexion BDD établie). Le proxy Nginx ne route les requêtes que vers les Pods "prêts".

### 1.3.2. Métriques et Suivi des Performances
Nous utilisons **Azure Monitor** et **Application Insights** pour remonter les indicateurs clés :
- Taux d'utilisation CPU/RAM des Pods (pour déclencher l'autoscaling HPA).
- Temps de réponse HTTP (surveillance du seuil p95 < 300ms).
- Taux d'erreur HTTP 5xx.

### 1.3.3. Modalités de Signalement
Lorsqu'un seuil critique est franchi (ex: Taux d'erreur > 1% sur 5 minutes), une alerte de sévérité 1 est déclenchée. Cette alerte est propagée via un Webhook vers le canal Microsoft Teams/Slack de l'équipe d'astreinte, accompagnée des logs pertinents pour accélérer le diagnostic.
