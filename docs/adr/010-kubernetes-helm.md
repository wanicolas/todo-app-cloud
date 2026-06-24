# ADR-010 : Migration vers Helm pour les déploiements Kubernetes

**Date** : juin 2026  
**Statut** : Accepté

## Contexte

Dans les phases précédentes, les déploiements Kubernetes locaux reposaient sur des fichiers manifests statiques (`auth.yaml`, `backend.yaml`, `client.yaml`, etc.) codés en dur. 
Ces configurations présentaient des limites majeures :
- Duplication des définitions pour les différents environnements (local test vs production AKS).
- Impossibilité d'injecter dynamiquement des secrets ou des configurations spécifiques (comme les DNS Azure ou le mode TLS).
- Cycle de déploiement et de rollback complexe consistant à appliquer manuellement plusieurs fichiers YAML.

## Décision

Nous avons migré l'ensemble des manifestes Kubernetes sous forme de **Chart Helm** dans `k8s/todo-app/`.
- Le Chart regroupe tous les templates applicatifs dans le sous-dossier `templates/`.
- Les configurations sont externalisées dans des fichiers de variables spécifiques :
  - `values.yaml` : Paramètres globaux par défaut.
  - `values-test.yaml` : Surcharges locales pour le développement et la validation locale (active MySQL localement et utilise HTTP).
  - `values-prod.yaml` : Surcharges de production (connexion MySQL managé avec SSL activé, activation du Secrets Store CSI pour Azure Key Vault, et TLS HTTPS sur le proxy).
- Le déploiement s'effectue en une commande unique (`helm upgrade --install`).

## Conséquences

- **Meilleure réutilisation** : Les mêmes templates structurels sont partagés entre le local et Azure AKS.
- **Maintenance simplifiée** : Toute modification d'architecture (ports, limites CPU) se fait à un seul endroit.
- **Gestion du cycle de vie** : Helm permet le versioning des déploiements et des rollbacks rapides en cas de panne.
- Les anciens fichiers statiques obsolètes ont été supprimés pour éviter la dérive de configuration.
