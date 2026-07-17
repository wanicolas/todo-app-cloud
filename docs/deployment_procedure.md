# Procédure de Déploiement - Todo App Cloud

Cette procédure explique pas à pas comment déployer l'infrastructure sur Azure, packager et pousser les images de conteneurs, et installer l'application sur le cluster AKS à l'aide de Helm.

---

## 1. Prérequis

Assurez-vous de disposer des outils suivants sur votre poste :

- **Azure CLI** (`az`) connecté à votre compte étudiant (`az login`).
- **Terraform** (version >= 1.0) installé.
- **Helm** (version 3) installé.
- **Docker** démarré pour construire les images.

---

## 2. Étape 1 : Provisionner l'infrastructure sur Azure (Terraform)

Accédez au dossier Terraform et initialisez le projet :

```bash
cd azure
terraform init
```

Déployez les ressources sur Azure (AKS, ACR, Key Vault, MySQL managé) :

```bash
terraform apply -auto-approve
```

Une fois le déploiement terminé, Terraform affiche des sorties (outputs) importantes. Notez ces valeurs :

- `resource_group_name` : Nom du groupe de ressources créé.
- `kubernetes_cluster_name` : Nom du cluster AKS.
- `container_registry_name` : Nom du registre ACR.
- `key_vault_name` : Nom du coffre Key Vault.
- `mysql_server_name` : DNS du serveur MySQL.

Revenez à la racine du projet :

```bash
cd ..
```

---

## 3. Étape 2 : Construire et pousser les images Docker (ACR)

Connectez-vous au registre Azure Container Registry (ACR) :

```bash
az acr login --name <NOM_DE_VOTRE_ACR>
```

Construisez les images de production de nos trois microservices :

```bash
# Backend
docker build -t <NOM_DE_VOTRE_ACR>.azurecr.io/backend:latest ./backend

# Auth Service
docker build -t <NOM_DE_VOTRE_ACR>.azurecr.io/auth:latest ./auth

# Client (Frontend)
docker build -t <NOM_DE_VOTRE_ACR>.azurecr.io/client:latest ./client
```

Poussez les images sur votre registre ACR :

```bash
docker push <NOM_DE_VOTRE_ACR>.azurecr.io/backend:latest
docker push <NOM_DE_VOTRE_ACR>.azurecr.io/auth:latest
docker push <NOM_DE_VOTRE_ACR>.azurecr.io/client:latest
```

---

## 4. Étape 3 : Déploiement de l'application (Helm)

### A. Déploiement Local (pour tester sur Docker Desktop / minikube)

Assurez-vous que votre contexte Kubernetes pointe sur votre cluster local :

```bash
# Déploiement avec les variables locales (SQL local, HTTP, sans Key Vault)
helm upgrade --install todo-app ./k8s/todo-app -f ./k8s/todo-app/values-test.yaml
```

### B. Déploiement en Production (sur Azure AKS)

Récupérez les identifiants de connexion de votre cluster AKS :

```bash
az aks get-credentials --resource-group <NOM_DE_VOTRE_RG> --name <NOM_DE_VOTRE_AKS>
```

Créez le secret TLS pour le HTTPS sur le proxy (générez un certificat autosigné pour le test ou utilisez votre certificat existant) :

```bash
# Générer une clé et un certificat autosigné rapides
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt -subj "/CN=todo.localhost"

# Charger le certificat dans le cluster Kubernetes
kubectl create secret tls todo-tls-cert --key tls.key --cert tls.crt
```

Déployez la stack sur AKS à l'aide de Helm, en écrasant les variables de production avec vos ressources Azure réelles (notamment le Client ID de l'identité du Secrets Store CSI d'AKS pour accéder au Key Vault) :

```bash
helm upgrade --install todo-app ./k8s/todo-app \
  -f ./k8s/todo-app/values-prod.yaml \
  --set mysql.host="<DNS_SERVEUR_MYSQL_TERRAFORM_OU_FQDN>" \
  --set mysql.authHost="<DNS_SERVEUR_MYSQL_TERRAFORM_OU_FQDN>" \
  --set keyvault.name="<NOM_DE_VOTRE_KEY_VAULT>" \
  --set keyvault.tenantId="<VOTRE_TENANT_ID_AZURE>" \
  --set keyvault.clientId="<AKS_KEYVAULT_SECRETS_PROVIDER_CLIENT_ID>" \
  --set client.image.repository="<NOM_DE_VOTRE_ACR>.azurecr.io/client" \
  --set backend.image.repository="<NOM_DE_VOTRE_ACR>.azurecr.io/backend" \
  --set auth.image.repository="<NOM_DE_VOTRE_ACR>.azurecr.io/auth"
```

---

## 5. Étape 4 : Vérification et accès

Vérifiez l'état de démarrage de vos pods :

```bash
kubectl get pods
```

Récupérez l'adresse IP publique de votre Reverse Proxy pour accéder à l'application :

```bash
kubectl get svc reverse-proxy
```

Visitez l'adresse `https://<IP_PUBLIQUE_REVERSE_PROXY>` (acceptez l'avertissement de sécurité si certificat autosigné).

---

## 6. Étape 5 : Déploiement Continu (GitHub Actions)

Pour automatiser la construction des images, la validation de sécurité et le déploiement sur AKS, un workflow de CD automatisé est configuré dans le dépôt : [.github/workflows/cd.yml](file:///.github/workflows/cd.yml).

### A. Sécurisation par Authentification OIDC (OpenID Connect)

Conformément aux bonnes pratiques DevSecOps et de sécurité Cloud (Entra ID / Azure AD), le pipeline n'utilise **aucun mot de passe ou secret d'API statique**. Il utilise une fédération d'identité temporaire et gratuite.

#### 1. Création de l'application d'authentification sur Azure

Générez un Service Principal sur votre abonnement Azure :

```bash
az ad sp create-for-rbac --name "github-actions-aks-cd" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>
```

#### 2. Configuration de la fédération d'identité (Trust Relationship)

Dans le portail Azure :

1. Allez sur **Microsoft Entra ID** > **App registrations** > Sélectionnez votre application `github-actions-aks-cd`.
2. Cliquez sur **Certificates & secrets** > onglet **Federated credentials** > **Add credential**.
3. Choisissez le scénario **GitHub Actions deploying Azure resources**.
4. Saisissez votre organisation/nom d'utilisateur GitHub, le nom de votre dépôt, et le type d'entité :
   - Pour la préproduction (Staging) : choisissez l'entité **Branch** et saisissez `main`.
   - Pour la production : choisissez l'entité **Tag** et saisissez le filtre `v*` (ex: `v1.0.0`).

### B. Configuration des Secrets GitHub

Ajoutez les variables publiques et identifiants suivants dans les paramètres de votre dépôt GitHub (Settings > Secrets and variables > Actions) :

| Nom du Secret           | Description / Valeur attendue                                                             |
| :---------------------- | :---------------------------------------------------------------------------------------- |
| `AZURE_CLIENT_ID`       | L'identifiant (Client ID) de l'application `github-actions-aks-cd` créée dans Entra ID.   |
| `AZURE_TENANT_ID`       | L'identifiant de votre locataire (Tenant ID) Azure Active Directory.                      |
| `AZURE_SUBSCRIPTION_ID` | L'identifiant de votre abonnement (Subscription ID) Azure.                                |
| `ACR_NAME`              | Nom unique de votre Azure Container Registry (ex: `myregistry`).                          |
| `RESOURCE_GROUP`        | Nom du groupe de ressources Azure contenant vos services (ex: `rg-todo-app`).             |
| `CLUSTER_NAME`          | Nom de votre cluster Azure AKS (ex: `aks-todo-app`).                                      |
| `MYSQL_HOST`            | DNS pleinement qualifié du serveur Azure MySQL Flexible (requis uniquement pour la prod). |
| `KEYVAULT_NAME`         | Nom de votre Azure Key Vault (requis uniquement pour la prod).                            |
| `KEYVAULT_TENANT_ID`    | Identifiant du Tenant Azure Active Directory (requis uniquement pour la prod).            |
| `KEYVAULT_CLIENT_ID`    | Client ID de l'identité managée du Secrets Store CSI (requis uniquement pour la prod).    |

### C. Déclenchement du Déploiement (GitFlow & GitOps)

Le pipeline de CD se déclenche automatiquement selon les événements du dépôt Git ou sur demande :

1.  **Déploiement en Staging (Automatique)** :
    - _Déclencheur_ : Un push ou une fusion de Pull Request réussie sur la branche `main`.
    - _Comportement_ : Les images sont construites, validées par Trivy, poussées sur l'ACR avec le tag `main-<commit_sha>` et déployées sur AKS dans le namespace `staging` à l'aide de la configuration légère [values-staging.yaml](../k8s/todo-app/values-staging.yaml) (BDD MySQL locale au cluster, Key Vault désactivé pour économiser les coûts).
2.  **Déploiement en Production (Automatique)** :
    - _Déclencheur_ : La création et le push d'un tag de version Git correspondant au format `v*` (ex: `v1.0.0`, `v2.1.0-rc1`).
    - _Comportement_ : Les images sont taguées avec le nom exact de la version, scannées par Trivy, poussées sur l'ACR et déployées dans le namespace `production` avec la configuration sécurisée [values-prod.yaml](../k8s/todo-app/values-prod.yaml) (Key Vault CSI active, TLS/HTTPS forcé, MySQL managé).
3.  **Déploiement Manuel (On-Demand)** :
    - _Déclencheur_ : Via l'onglet **Actions** de GitHub, en cliquant sur **CD Deploy to AKS** puis **Run workflow** (avec sélection de la branche et de l'environnement).
