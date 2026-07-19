# Présentation des Mesures de Sécurité Mises en Œuvre

La sécurité de la solution s'appuie sur le principe de la **défense en profondeur** et du **Zero Trust**, couvrant le code source applicatif (OWASP Top 10) et l'infrastructure Cloud (DevSecOps).

---

## Alignement sur les Menaces de l'OWASP Top 10

L'architecture logicielle apporte des réponses techniques systématiques aux failles de sécurité majeures :

- **Contrôle d'accès défaillant (A01: Broken Access Control)** :
  - L'accès aux ressources est cloisonné par identifiant utilisateur (`userId`).
  - Le middleware `requireAuth` extrait l'`userId` du jeton JWT et le propage. Le dépôt Knex applique systématiquement la clause `WHERE user_id = userId` sur toutes les opérations d'écriture et de lecture.
- **Défaillances cryptographiques (A02: Cryptographic Failures)** :
  - Les mots de passe sont hachés de manière asymétrique via **bcrypt** (facteur de coût de 10).
  - Les sessions s'appuient sur des cookies de session JWT sécurisés : configurés en **`HttpOnly`** (invisibles au JavaScript contre les attaques XSS), **`Secure`** (transmission HTTPS stricte) et **`SameSite=Strict`** (protection contre le CSRF).
- **Injections (A03: Injection)** :
  - Toutes les interactions avec les bases de données SQL sont gérées par le query-builder **Knex.js** qui utilise des requêtes paramétrées par défaut, éliminant tout risque d'injection SQL.
- **Mauvaises configurations de sécurité (A05: Security Misconfiguration)** :
  - Les conteneurs de production s'exécutent avec des comptes restreints non-privilégiés (`node` et `nginx` sur port 8080) avec l'option `runAsNonRoot: true`.
  - Le démarrage de l'authentification crash instantanément (`throw Error`) si la clé de signature du jeton est absente ou non sécurisée en production.
- **Faiblesses d'identification et d'authentification (A07: Identification and Authentication Failures)** :
  - Le middleware `express-rate-limit` restreint les tentatives d'authentification brute-force à 5 essais par tranche de 15 minutes par adresse IP.

---

## Hardening DevSecOps et Sécurisation de l'Infrastructure

L'infrastructure provisionnée (Terraform) et déployée (Helm) met en œuvre des mécanismes d'isolation avancés :

- **Gestion des Secrets (Key Vault & CSI Driver)** :
  - Aucun secret ou mot de passe n'est écrit en clair dans le code ou sur Git.
  - Les secrets de production sont stockés dans **Azure Key Vault** (protection anti-suppression active).
  - L'identité managée du cluster AKS utilise le pilote **Secrets Store CSI Driver** pour monter de façon éphémère les secrets sous forme de fichiers temporaires (`/mnt/secrets/*`) au démarrage des pods.
- **Fédération d'Identité OIDC en CI/CD** :
  - Le pipeline GitHub Actions se connecte à Azure via le protocole **OpenID Connect (OIDC)** sans utiliser de secret ou mot de passe statique stocké sur GitHub.
- **Isolation Réseau Privée (VNet Integration)** :
  - Le serveur Azure MySQL Flexible est isolé dans un sous-réseau privé délégué (VNet) sans exposition publique.
  - La communication entre AKS et MySQL s'effectue exclusivement en interne via une **Zone DNS Privée** (`private.mysql.database.azure.com`).
- **Cloisonnement Kubernetes (Network Policies)** :
  - Des règles réseau **NetworkPolicies** bloquent par défaut tout trafic entrant dans les pods applicatifs. Seul le Reverse Proxy Nginx peut recevoir du trafic internet public et rediriger de façon sécurisée vers les microservices internes.
