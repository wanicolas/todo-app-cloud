# ADR-011 : Sécurisation de l'Infrastructure, Isolation Réseau et Injection des Secrets

**Date** : juin 2026  
**Statut** : Accepté

## Contexte

La grille d'évaluation et les consignes de sécurité Cloud imposent des contraintes strictes sur la production :
- Chiffrement des flux de données sensibles en transit (TLS/HTTPS).
- Non-exposition des secrets en clair dans les variables d'environnement des conteneurs.
- Exécution des conteneurs sous des privilèges minimums (non-root).
- Non-exposition des bases de données de production sur le réseau public d'Internet.
- Protection et contrôle d'accès strict pour le stockage des clés et secrets.

## Décision

Nous avons mis en place une architecture d'infrastructure et de sécurité renforcée ("SecOps") via Terraform :

1. **Isolation Réseau & Subnet Délégué** :
   - Mise en place d'un réseau virtuel Azure (VNet) découpé en deux sous-réseaux : un pour le cluster AKS (`aks-subnet`) et un autre délégué (`mysql-subnet`) à l'usage exclusif de la base MySQL Flexible Server.
   - Création d'une **Zone DNS Privée** (`private.mysql.database.azure.com`) liée au VNet. La base de données MySQL Flexible Server y est uniquement résolue en interne.
   - Suppression de toutes les règles de pare-feu d'exposition publique. La base n'est plus accessible depuis Internet, mais uniquement par les pods AKS routés en interne.
2. **Azure Key Vault & RBAC Moderne** :
   - Initialisation d'Azure Key Vault avec l'activation de la protection anti-suppression (**`purge_protection_enabled`**).
   - Utilisation de l'autorisation **Azure RBAC** (`enable_rbac_authorization = true`) pour le coffre à la place des anciennes stratégies d'accès statiques.
   - Attribution du rôle de sécurité **`Key Vault Secrets User`** à l'identité managée du Secrets Store CSI d'AKS.
   - Les secrets (mots de passe BDD, secret JWT) sont montés directement en tant que volumes de fichiers (`/mnt/secrets/*`) dans les pods AKS. Les applications Node.js lisent ces secrets via les variables `MYSQL_PASSWORD_FILE` et `JWT_SECRET_FILE`.
3. **Chiffrement en transit (TLS/HTTPS)** :
   - Enforcement du TLS via le paramètre de sécurité `require_secure_transport = "ON"` sur l'instance Azure MySQL Flexible Server.
   - Configuration de la connexion Knex dans les microservices pour forcer le chiffrement SSL/TLS (`ssl: { rejectUnauthorized: false }`).
   - Le reverse-proxy Nginx gère le TLS (HTTPS port 443) et redirige automatiquement les requêtes HTTP.
4. **Conteneurs Non-Root** :
   - Les Dockerfiles de production backend et auth s'exécutent avec l'utilisateur non-privilégié `node` (`USER node`).
   - Le client frontend utilise l'image `nginxinc/nginx-unprivileged:alpine` et s'exécute en tant que `nginx` sur le port `8080`.

## Conséquences

- **Sécurité réseau renforcée** : La base de données est complètement isolée de l'extérieur.
- **Risques d'élévation de privilèges réduits** : Pas d'usage de clés d'API statiques et exploitation des identités managées Azure.
- **Zéro fuite de secrets** : Aucun mot de passe en clair dans Git ou dans l'environnement d'exécution de Kubernetes.
- **Données sensibles chiffrées** de bout en bout.

