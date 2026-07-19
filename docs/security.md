# Présentation des Mesures de Sécurité Mises en Œuvre (C2.2.3)

La sécurité du projet **Todo App Cloud** a été pensée selon les principes du **Defense in Depth** (Défense en profondeur) et du **Zero Trust**. Elle couvre à la fois la sécurisation du code source applicatif (conduite par l'OWASP Top 10) et le durcissement de l'infrastructure Cloud et de l'orchestrateur (DevSecOps).

---

## 1. Couverture des Menaces de l'OWASP Top 10

L'architecture applicative a été conçue pour parer systématiquement les dix menaces de sécurité web les plus critiques décrites par l'OWASP :

### A. Contrôle d'accès défaillant (A01: Broken Access Control)
- **Cloisonnement strict (Multitenancy)** : Chaque appel API vers le backend de tâches exige la présence d'un token JWT. Le middleware `requireAuth` extrait l'identifiant utilisateur (`userId`) et le transmet aux couches inférieures.
- **Requêtes liées à l'utilisateur** : Le dépôt Knex force la condition `WHERE user_id = userId` sur l'ensemble des requêtes (lecture, modification, suppression). Un utilisateur ne peut en aucun cas modifier l'identifiant d'une ressource pour accéder aux données d'un autre utilisateur. Cette isolation est validée par des tests unitaires automatisés.

### B. Défaillances cryptographiques (A02: Cryptographic Failures)
- **Hachage robuste** : Les mots de passe des utilisateurs sont hachés de manière asymétrique à l'aide de **bcrypt** avec un facteur de coût de 10 tours (Work Factor), prévenant les attaques par tables de correspondance (Rainbow Tables).
- **Session sécurisée** : Les jetons de session JWT sont transmis via des cookies munis des flags de sécurité **`HttpOnly`** (le jeton est inaccessible par JavaScript, bloquant l'exfiltration en cas de faille XSS), **`Secure`** (transmission exclusive sous chiffrement TLS) et **`SameSite=Strict`** (prévention des attaques CSRF).
- **Flux chiffrés (In-Transit)** : La communication avec le serveur MySQL Flexible d'Azure impose le chiffrement SSL/TLS (`require_secure_transport = ON`), et le proxy HTTP redirige automatiquement tout trafic non chiffré vers HTTPS.

### C. Injections (A03: Injection)
- **Requêtes paramétrées** : Le projet proscrit l'usage de requêtes SQL brutes concaténées. L'utilisation systématique du query-builder **Knex.js** garantit que toutes les entrées utilisateurs sont traitées comme des paramètres de requêtes, éliminant tout risque d'injection SQL.

### D. Mauvaises configurations de sécurité (A05: Security Misconfiguration)
- **Principe du privilège minimum (Non-Root)** : Les conteneurs de production s'exécutent sous des utilisateurs système restreints (`node` pour Express, `nginx` non-privilégié pour le front). L'escalade de privilèges est interdite dans Kubernetes (`allowPrivilegeEscalation: false`).
- **Fail-Secure** : En cas de configuration invalide ou d'absence de clé de chiffrement JWT en production, le microservice crash au démarrage (`throw Error`) pour éviter tout mode dégradé non sécurisé (Fail-Open).

### E. Faiblesses d'identification et d'authentification (A07: Identification and Authentication Failures)
- **Limiteur de débit (Rate Limiter)** : Un middleware de rate-limiting (`express-rate-limit`) est appliqué sur la mire de connexion, limitant les requêtes à 5 essais par tranche de 15 minutes par adresse IP pour bloquer les attaques par force brute.

---

## 2. Hardening DevSecOps et Sécurité de l'Infrastructure

L'infrastructure Cloud (Terraform) et le déploiement (Helm) intègrent des mécanismes de pointe pour isoler les ressources et sécuriser les configurations :

```
[ Trafic Public ] ──> ( Ingress / Proxy HTTPS )
                             │
                             │ (Filtré par NetworkPolicies)
                             ▼
                    [ Pods AKS (Non-Root) ]
                     ├─ secrets montés en fichiers via CSI Driver <── ( Azure Key Vault )
                     └─ accès SQL privé via VNet ─────────────────────> ( MySQL Flexible Server )
                                                                         (Isolé d'Internet)
```

### A. Gestion des Secrets via Key Vault & CSI Driver (Zero Hardcoded Secrets)
Le projet n'enregistre aucun mot de passe ou clé de chiffrement en clair dans le code ou les manifestes Git :
1. Les secrets de production sont stockés dans **Azure Key Vault** (avec protection anti-suppression forcée).
2. L'identité managée du cluster AKS utilise le pilote **Secrets Store CSI Driver** pour accéder au coffre en utilisant les privilèges d'autorisation Azure RBAC.
3. Les secrets sont montés de façon éphémère directement dans la mémoire du pod sous forme de fichiers volumineux (`/mnt/secrets/*`). Les microservices Node.js lisent ces fichiers au démarrage, évitant ainsi d'exposer les secrets dans les variables d'environnement du conteneur (invisibles aux dumps de processus).

### B. Authentification CI/CD par fédération d'identité (OIDC)
Le pipeline de déploiement continu dans GitHub Actions n'utilise **aucune clé d'API ou mot de passe de service principal statique**. L'authentification auprès d'Azure s'appuie sur le protocole **OpenID Connect (OIDC)**. GitHub Actions génère un jeton d'identité temporaire à la volée, qui est validé par Microsoft Entra ID pour accorder des droits d'accès limités dans le temps, éliminant le risque de vol de secrets d'intégration.

### C. Isolation Réseau Azure (VNet Integration)
La base de données MySQL de production est configurée avec une exposition réseau externe nulle :
- Elle est intégrée dans un sous-réseau délégué (*MySQL Subnet*) au sein d'un réseau virtuel privé Azure (VNet).
- L'accès par adresse IP publique est totalement désactivé sur Azure.
- La communication entre le cluster AKS et le serveur MySQL s'effectue exclusivement en interne au travers d'une **Zone DNS Privée** (`private.mysql.database.azure.com`) liée au VNet.

### D. Cloisonnement Kubernetes (Network Policies)
Par défaut, Kubernetes autorise la communication entre tous les conteneurs du cluster. Pour appliquer le principe de Zero Trust, nous mettons en œuvre des **NetworkPolicies** Calico :
- Tout trafic entrant (*Ingress*) est bloqué par défaut pour les conteneurs `backend`, `auth` et `client`.
- Seul le Reverse Proxy Nginx est exposé au trafic externe et est autorisé à contacter les services applicatifs internes. Un conteneur frontal compromis ne peut pas être utilisé pour scanner ou attaquer le reste du réseau interne.
