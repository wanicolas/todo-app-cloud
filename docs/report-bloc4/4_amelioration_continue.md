## 4.1. Propositions d'Axes d'Amélioration (C4.3.1)

Sur la base de l'analyse des métriques de production et des retours utilisateurs, deux axes majeurs de perfectionnement technique sont proposés pour garantir la scalabilité et renforcer l'attractivité du logiciel, tout en maîtrisant les coûts.

### Axe 1 : Mise en place d'un Cache Redis (Performance)
- **Constat :** L'endpoint `GET /api/items` concentre 80% du trafic. Chaque requête interroge directement la base de données MySQL, ce qui augmente le temps de réponse (actuellement ~150ms) et sollicite inutilement la BDD pour des données peu volatiles.
- **Solution proposée :** Intégrer un cluster Redis (Azure Cache for Redis) entre le backend Express et MySQL.
- **Gains évalués :** 
  - Réduction du temps de réponse p95 en dessous de 50ms.
  - Capacité d'absorber des pics de charge (Black Friday, etc.) sans redimensionner le serveur MySQL.
- **Délai & Coût :** ~1 semaine de développement (Sprint). Coût additionnel d'environ 30€/mois pour l'instance Redis, compensé par l'économie sur le redimensionnement MySQL.

### Axe 2 : Migration vers Azure Container Apps (Optimisation des Coûts)
- **Constat :** L'application est actuellement hébergée sur un cluster Kubernetes (AKS) dédié. Les nœuds VMs tournent 24h/24, y compris la nuit où le trafic est nul, générant un coût fixe élevé.
- **Solution proposée :** Basculer les microservices d'AKS vers *Azure Container Apps* (environnement Serverless Kubernetes).
- **Gains évalués :** 
  - Facturation à la milliseconde de calcul réel (Scale-to-Zero la nuit).
  - Réduction de la charge opérationnelle (plus de cluster ou de VMs à patcher).
- **Délai & Coût :** ~2 semaines pour refondre le code Terraform et les pipelines GitHub Actions. Gain financier estimé : -40% sur la facture mensuelle d'infrastructure.

## 4.2. Historique des Versions et Correctifs (C4.3.2)

Le journal des versions (Changelog) assure la traçabilité des évolutions et correctifs déployés en production.

| Version | Date | Type de modification | Description des évolutions et correctifs |
| :--- | :--- | :--- | :--- |
| **v2.1.2** | 03/08/2026 | Correctif (MCO) | - **Fix (Frontend) :** Résolution d'une *Race Condition* provoquant le clignotement des cases à cocher lors de clics rapides (Ticket SUP-89). |
| **v2.1.1** | 28/07/2026 | Correctif (MCO) | - **Fix (Auth) :** Extension de la durée de vie du JWT (de 1h à 12h) pour éviter les déconnexions intempestives (Ticket INC-1042). <br> - **Sec (Dépendances) :** Mise à jour mineure de la lib `express` suite alerte Dependabot. |
| **v2.1.0** | 20/07/2026 | Architecture | - Version initiale Cloud validée (Bloc 2).<br>- Provisionnement IaC Terraform et déploiement Kubernetes AKS. |
| **v2.0.0** | 22/06/2026 | CI/CD | - Création du workflow automatisé GitHub Actions et packaging Helm. |
| **v1.2.0** | 28/05/2026 | Fonctionnalité | - Implémentation de la conformité RGPD (portabilité et suppression). |
