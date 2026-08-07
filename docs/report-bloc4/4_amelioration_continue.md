## Propositions d'Axes d'Amélioration (C4.3.1)

Sur la base de l'analyse conjointe des métriques de performance de production et de l'analyse des retours utilisateurs, trois axes majeurs de perfectionnement sont proposés pour maintenir la scalabilité, maîtriser les coûts et renforcer l'attractivité du logiciel.

### Axe 1 : Mise en place d'un Cache Redis (Performance)

- **Constat & Métriques :** Suite à plusieurs retours d'utilisateurs signalant des lenteurs d'affichage le matin (pics d'utilisation), l'analyse d'Application Insights a révélé que l'endpoint `GET /api/items` concentre 80% du trafic. Chaque appel interroge la base MySQL avec un temps de réponse moyen de 150ms.
- **Solution proposée :** Intégrer une couche de cache Redis (_Azure Cache for Redis_) avec invalidation sur mutation.
- **Gains évalués :**
  - Réduction du temps de réponse p95 en dessous de 50ms (-66% de latence).
  - Absorption des pics de charge sans redimensionnement de l'instance BDD.
- **Délai & Coût :** ~1 semaine de développement. Coût additionnel d'environ 30€/mois, compensé par l'économie sur les instances MySQL.

### Axe 2 : Migration vers Azure Container Apps (Optimisation des Coûts Infra)

- **Constat :** L'application est hébergée sur un cluster AKS dédié dont les nœuds VMs tournent 24h/24, y compris la nuit où le trafic est quasi nul.
- **Solution proposée :** Basculer les microservices vers _Azure Container Apps_ (Serverless Kubernetes).
- **Gains évalués :** Facturation au temps de calcul réel (Scale-to-Zero la nuit) et réduction estimée de 40% sur la facture Azure mensuelle.
- **Délai & Coût :** ~2 semaines de refonte Terraform et CI/CD.

### Axe 3 : Attractivité Fonctionnelle et Ergonomie (Retours Utilisateurs / UX)

- **Constat & Retours Utilisateurs :** L'analyse des questionnaires de satisfaction utilisateurs (NPS) et des demandes d'assistance au support fait ressortir deux besoins majeurs : la possibilité d'organiser les tâches par dossiers/étiquettes et la présence d'un Mode Sombre (_Dark Mode_) pour l'utilisation nocturne sur mobile.
- **Solution proposée :**
  1. Implémentation d'un filtre dynamique par catégories/tags côté Frontend.
  2. Intégration d'un thème somptueux sombre (Dark Mode) commutable via CSS custom properties.
- **Gains évalués :** Renforcement direct de l'attractivité de l'application, amélioration de la rétention utilisateur (+20% d'engagement quotidien projeté) et alignement sur les standards modernes de design.
- **Délai & Coût :** ~1 semaine de développement Frontend. Aucun coût d'infrastructure additionnel.

### Priorisation et Feuille de Route (Matrice Valeur / Effort)

Afin d'ordonnancer efficacement ces chantiers dans le plan de charge de l'équipe, une évaluation selon la matrice Valeur / Effort / ROI a été réalisée :

| Axe d'Amélioration                    | Valeur Métier / Technique           | Effort (J/H) |  Impact Financier  |       Priorité       |
| :------------------------------------ | :---------------------------------- | :----------: | :----------------: | :------------------: |
| **Axe 1 : Cache Redis**               | High (Latence -66%, Stabilité)      |  Moyen (5j)  |     +30€/mois      |  **P1 (Immédiat)**   |
| **Axe 3 : UX & Dark Mode**            | High (Rétention +20%, Attractivité) | Faible (4j)  |         0€         | **P2 (Court terme)** |
| **Axe 2 : Serverless Container Apps** | Medium (Optimisation Infra)         | Élevé (10j)  | -40% Facture Azure | **P3 (Moyen terme)** |

## Historique des Versions et Correctifs (C4.3.2)

Le journal des versions (Changelog) assure la traçabilité des évolutions et correctifs déployés en production. Il est directement couplé au système de gestion de versions Git et à la plateforme **GitHub Releases**.

### Stratégie de Versionnement et GitHub Releases

Chaque livraison en production donne lieu à la création d'un **Tag Git annoté** (ex: `git tag -a v2.1.2 -m "Hotfix: Race condition checkbox"`) poussé sur le dépôt principal.

Via l'intégration native de **GitHub Releases** et le suivi des conventions de commits (_Conventional Commits_), le Changelog ci-dessous est automatiquement publié sur la page _Releases_ du dépôt GitHub à chaque tag déployé. De plus, un fichier `CHANGELOG.md` est maintenu à la racine du dépôt code source pour consultation directe par les développeurs.

### Journal de Versions Déployées

| Version    | Date       | Type de modification | Description des évolutions et correctifs                                                                                                                                                                                           |
| :--------- | :--------- | :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v2.1.2** | 03/08/2026 | Correctif (MCO)      | - **Fix (Frontend) :** Résolution d'une _Race Condition_ provoquant le clignotement des cases à cocher lors de clics rapides (Ticket SUP-89).                                                                                      |
| **v2.1.1** | 28/07/2026 | Correctif (MCO)      | - **Fix (Auth) :** Extension de la durée de vie du JWT (de 1h à 12h) pour éviter les déconnexions intempestives (Ticket INC-1042). <br> - **Sec (Dépendances) :** Mise à jour mineure de la lib `express` suite alerte Dependabot. |
| **v2.1.0** | 20/07/2026 | Architecture         | - Version initiale Cloud validée (Bloc 2).<br>- Provisionnement IaC Terraform et déploiement Kubernetes AKS.                                                                                                                       |
| **v2.0.0** | 22/06/2026 | CI/CD                | - Création du workflow automatisé GitHub Actions et packaging Helm.                                                                                                                                                                |
| **v1.2.0** | 28/05/2026 | Fonctionnalité       | - Implémentation de la conformité RGPD (portabilité et suppression).                                                                                                                                                               |

_Note : Chaque version publiée dans GitHub Releases est accompagnée des artéfacts associés (chart Helm, images Docker taguées) ainsi que d'une fiche Markdown technique synthétisant la résolution des bugs concernés pour la base de connaissances de l'équipe._
