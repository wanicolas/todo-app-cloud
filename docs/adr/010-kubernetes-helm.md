# ADR-010 : Migration vers Helm et Durcissement Sécurisé Kubernetes (NetworkPolicies, SecurityContexts, PDB, HPA)

**Date** : juin 2026  
**Statut** : Accepté

## Contexte

Dans les phases précédentes, les déploiements Kubernetes locaux reposaient sur des fichiers manifests statiques (`auth.yaml`, `backend.yaml`, `client.yaml`, etc.) codés en dur. 
Ces configurations présentaient des limites majeures :
- Duplication des définitions pour les différents environnements (local test vs production AKS).
- Impossibilité d'injecter dynamiquement des secrets ou des configurations spécifiques (comme les DNS Azure ou le mode TLS).
- Cycle de déploiement et de rollback complexe consistant à appliquer manuellement plusieurs fichiers YAML.
- Absence de durcissement des conteneurs (exécution en mode root par défaut, absence de pare-feu réseau Kubernetes, etc.).

## Décision

Nous avons migré l'ensemble des manifestes Kubernetes sous forme de **Chart Helm** dans `k8s/todo-app/` et renforcé la sécurité du cluster :

1. **Modularisation par Chart Helm** :
   - Centralisation des templates applicatifs dans `templates/`.
   - Externalisation des configurations dans des profils de variables spécifiques (`values-test.yaml` pour le local et `values-prod.yaml` pour Azure AKS).
2. **Hardening Kubernetes (Sécurité & Isolation)** :
   - **Zero Trust NetworkPolicies** : Mise en place d'un pare-feu interne fermant tout flux entrant par défaut (`default-deny-ingress`). Seul le reverse-proxy est publiquement accessible et il est le seul autorisé à initier des flux vers les pods internes backend, auth et client.
   - **SecurityContexts restrictifs** : Configuration de règles d'exécution strictes dans les templates : les conteneurs s'exécutent obligatoirement sans privilèges administrateur (**`runAsNonRoot: true`**) et l'escalade de privilèges est désactivée (**`allowPrivilegeEscalation: false`**).
3. **Haute Disponibilité & Zéro Downtime** :
   - **HPA (Horizontal Pod Autoscalers)** : Autoscaling dynamique de tous les services basé sur la charge CPU (cible de 80%).
   - **PDB (Pod Disruption Budgets)** : Sécurisation des interruptions avec `minAvailable: 1` pour éviter la perte de pods de production lors des maintenances de nœuds d'Azure (Node Draining).
4. **Déploiements Fiables et Atomiques** :
   - Utilisation du flag **`--atomic`** dans le déploiement Helm. En cas de plantage d'un nouveau pod au démarrage (erreur de config, crash à l'initialisation), Helm annule automatiquement le déploiement et effectue un rollback propre vers la révision précédente.

## Conséquences

- **Meilleure réutilisation** : Les mêmes templates structurels sont partagés de façon sécurisée entre le local et la production.
- **Surface d'attaque minimale** : Les conteneurs compromis ne peuvent pas s'évader ou escalader leurs droits sur le nœud.
- **Tolérance aux pannes** : Zéro coupure de service lors des déploiements et des opérations de maintenance.

