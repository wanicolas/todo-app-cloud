# ADR-016 : Hardening DevSecOps, VNet et Zero Trust Kubernetes

**Date** : juillet 2026  
**Statut** : Accepté

## Contexte

Bien que l'infrastructure Azure initiale provisionnait les ressources nécessaires (AKS, MySQL, Key Vault), elle présentait plusieurs vulnérabilités de sécurité identifiées lors d'un audit DevSecOps :
1. La base de données MySQL Flexible Server était exposée à l'ensemble du réseau Azure (règle Firewall `0.0.0.0`).
2. Les communications inter-pods dans le cluster Kubernetes étaient ouvertes par défaut.
3. Le Key Vault utilisait des Access Policies obsolètes sans protection contre la suppression définitive.
4. Les pods applicatifs manquaient de configurations de sécurité strictes (Security Contexts) et de garanties de haute disponibilité (HPA, PDB).

## Décision

Nous avons appliqué un durcissement complet (Hardening) de l'infrastructure Cloud et de l'orchestrateur Kubernetes :

1. **Isolation Réseau Azure (VNet Integration)** :
   - Déploiement d'un réseau virtuel privé (*Virtual Network*) avec deux sous-réseaux (*Subnets*).
   - La base de données MySQL a été isolée dans un *Delegated Subnet* dédié et est désormais résolue par le cluster via une **Private DNS Zone**. L'accès par IP externe a été définitivement désactivé.
2. **Key Vault RBAC** :
   - Activation de la `purge_protection` pour empêcher la perte irréversible de secrets par erreur ou malveillance.
   - Migration vers **Azure RBAC** : l'identité CSI du cluster AKS se voit octroyer le rôle strict `Key Vault Secrets User`.
3. **Architecture Zero Trust Kubernetes** :
   - Création de `NetworkPolicies` bloquant tout le trafic entrant (Ingress) par défaut dans le cluster.
   - Seul le conteneur `reverse-proxy` (Nginx) est autorisé à recevoir du trafic depuis l'extérieur et à interagir avec les microservices internes (`backend`, `client`, `auth`).
4. **Security Contexts** :
   - Imposition des règles `runAsNonRoot: true`, `runAsUser: 1000` et `allowPrivilegeEscalation: false` dans les manifestes Helm des microservices Node.js et du client React.
5. **Haute Disponibilité & Résilience** :
   - Mise en place d'Autoscalers (`HorizontalPodAutoscaler`) pour chaque service avec un seuil de déclenchement à 80% d'utilisation CPU.
   - Ajout de `PodDisruptionBudget` (`minAvailable: 1`) pour prévenir tout downtime (interruption de service) lors des purges ou mises à jour des nœuds physiques AKS par l'hébergeur Azure.

## Conséquences

- **Sécurité maximale des données** : MySQL n'est plus joignable depuis l'extérieur du réseau privé.
- **Résilience accrue** : l'application encaisse automatiquement les montées en charge et résiste aux reboots d'infrastructure.
- **Isolation stricte** : un pod frontal compromis ne peut pas se propager sur le réseau interne (Pivoting bloqué par les NetworkPolicies).
