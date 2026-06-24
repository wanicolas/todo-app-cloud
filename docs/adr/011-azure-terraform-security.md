# ADR-011 : Sécurisation de l'Infrastructure et Injection des Secrets

**Date** : juin 2026  
**Statut** : Accepté

## Contexte

La grille d'évaluation et les consignes de sécurité Cloud imposent des contraintes strictes sur la production :
- Chiffrement des flux de données sensibles en transit (TLS/HTTPS).
- Non-exposition des secrets en clair dans les variables d'environnement des conteneurs.
- Exécution des conteneurs sous des privilèges minimums (non-root).

## Décision

Nous avons mis en place une architecture de sécurité renforcée ("SecOps") :
1. **Azure Key Vault & CSI Driver** : 
   - Terraform active le module complémentaire `key_vault_secrets_provider` sur le cluster AKS.
   - Les secrets (mots de passe BDD, secret JWT) sont stockés de façon sécurisée dans le Key Vault et ne sont plus définis dans le code Git.
   - Ils sont montés directement en tant que volumes de fichiers (`/mnt/secrets/*`) dans les pods AKS via le driver Secrets Store CSI.
   - Les applications Node.js lisent ces secrets via les variables `MYSQL_PASSWORD_FILE` et `JWT_SECRET_FILE`.
2. **Chiffrement en transit (TLS/HTTPS)** :
   - Activation du paramètre de sécurité `require_secure_transport = "ON"` sur l'instance Azure MySQL Flexible Server.
   - Configuration de la connexion Knex dans les microservices pour forcer le chiffrement SSL/TLS (`ssl: { rejectUnauthorized: false }`).
   - Le reverse-proxy Nginx gère le TLS (HTTPS port 443) et redirige automatiquement les requêtes HTTP.
3. **Conteneurs Non-Root** :
   - Les Dockerfiles de production backend et auth s'exécutent avec l'utilisateur non-privilégié `node` (`USER node`).
   - Le client frontend utilise l'image `nginxinc/nginx-unprivileged:alpine` et s'exécute en tant que `nginx` sur le port `8080`.

## Conséquences

- Risques d'élévation de privilèges réduits au minimum dans le cluster.
- Aucun mot de passe en clair visible via des commandes d'inspection Kubernetes comme `kubectl describe pod`.
- Données sensibles chiffrées de bout en bout en transit vers le stockage de données.
