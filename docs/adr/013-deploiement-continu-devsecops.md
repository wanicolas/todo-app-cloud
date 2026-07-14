# ADR-013 : Déploiement Continu (CD) Automatisé, OIDC et DevSecOps

**Date** : juillet 2026  
**Statut** : Accepté

## Contexte

Les compétences **C2.1.1** et **C2.2.4** du référentiel d'évaluation imposent de mettre en place un protocole de déploiement continu (CD) sur différents environnements de test et de production.

Le pipeline initial de CD était entièrement manuel et reposait sur l'injection de secrets d'authentification Azure statiques (`AZURE_CREDENTIALS` contenant un mot de passe de Service Principal au format JSON), ce qui posait un risque majeur de sécurité. De plus, il n'y avait pas de distinction claire de configuration entre l'environnement de préproduction (Staging) et la Production, et aucun mécanisme n'assurait le maintien en condition de sécurité (MCS) des images Docker vis-à-vis des CVEs nouvellement découvertes.

## Décision

Nous avons décidé de restructurer le déploiement continu en y appliquant les bonnes pratiques DevSecOps et GitOps de l'industrie :

1. **Authentification OIDC (OpenID Connect) sans secret** : Remplacement des secrets d'API statiques dans GitHub par une fédération d'identité d'application Entra ID (Azure AD Workload Identity). GitHub Actions s'authentifie auprès d'Azure de manière temporaire à l'aide d'un jeton d'identité cryptographique à courte durée de vie (`permissions: id-token: write`).
2. **Déploiement automatisé basé sur le cycle Git (GitFlow)** :
   - **Staging (Préproduction)** : Déploiement automatique déclenché lors de chaque push ou fusion sur la branche `develop`.
   - **Production** : Déploiement automatique déclenché uniquement lors de la publication d'un tag de version `v*` (ex: `v1.0.0`) sur la branche principale `main`.
3. **Isolation par namespaces Kubernetes** : L'environnement de Staging et de Production tournent de manière isolée sur le même cluster AKS à l'aide de namespaces distincts (`--namespace staging` vs `--namespace production`).
4. **Fichiers de valeurs Helm dédiés & Éco-conception** :
   - Création de `values-staging.yaml` : Pour réduire les coûts dans l'environnement de test, la base MySQL managée est désactivée au profit d'un conteneur MySQL local interne au cluster, et l'intégration Key Vault est désactivée.
   - Utilisation de `values-prod.yaml` : La Production utilise la base de données Azure MySQL Flexible hautement disponible, le chiffrement SSL forcé et l'intégration Azure Key Vault via Secrets Store CSI.
5. **Optimisation des conteneurs (Alpine Linux)** : Remplacement des images de production `node:slim` par des images minimales **`node:alpine`** et **`nginx:alpine`**, réduisant la taille des images finales afin d'accélérer l'auto-scaling d'AKS (Cold Start réduit) et de réduire la surface d'attaque système.
6. **Scan de vulnérabilités Trivy & Dependabot** :
   - Trivy scanne les images construites dans le pipeline CD et bloque immédiatement le déploiement (`exit-code: 1`) si une faille critique ou haute _avec correctif connu_ est détectée.
   - Configuration de **Dependabot** (`.github/dependabot.yml`) pour scanner hebdomadairement et proposer des PR de mise à jour automatique pour npm, les images Docker et les workflows GitHub Actions.

## Conséquences

- **Sécurité renforcée** : Aucune clé d'API ou mot de passe Azure n'est stocké dans GitHub, éliminant les risques de compromission d'infrastructure par vol de secrets.
- **Automatisation complète et traçable** : Les déploiements sont directement liés aux releases logicielles (tags Git) et aux cycles de développement.
- **Économie de ressources** : L'environnement de préproduction n'induit aucun surcoût de base de données Azure managée.
- **Images durcies et minimales** : Surface d'attaque système réduite au minimum, ce qui se traduit par un nombre de failles CVE détectées proche de zéro.
