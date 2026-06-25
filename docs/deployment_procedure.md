# Procédure de Déploiement - Todo App Cloud

Cette procédure explique pas à pas comment déployer l'infrastructure sur Azure, packager et pousser les images de conteneurs, et installer l'application sur le cluster AKS à l'aide de Helm.

---

## 1. Prérequis

Assurez-vous de disposer des outils suivants sur votre poste :
*   **Azure CLI** (`az`) connecté à votre compte étudiant (`az login`).
*   **Terraform** (version >= 1.0) installé.
*   **Helm** (version 3) installé.
*   **Docker** démarré pour construire les images.

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
*   `resource_group_name` : Nom du groupe de ressources créé.
*   `kubernetes_cluster_name` : Nom du cluster AKS.
*   `container_registry_name` : Nom du registre ACR.
*   `key_vault_name` : Nom du coffre Key Vault.
*   `mysql_server_name` : DNS du serveur MySQL.

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

Déployez la stack sur AKS à l'aide de Helm, en écrasant les variables de production avec vos ressources Azure réelles :
```bash
helm upgrade --install todo-app ./k8s/todo-app \
  -f ./k8s/todo-app/values-prod.yaml \
  --set mysql.host="<DNS_SERVEUR_MYSQL_TERRAFORM>.mysql.database.azure.com" \
  --set mysql.authHost="<DNS_SERVEUR_MYSQL_TERRAFORM>.mysql.database.azure.com" \
  --set keyvault.name="<NOM_DE_VOTRE_KEY_VAULT>" \
  --set keyvault.tenantId="<VOTRE_TENANT_ID_AZURE>" \
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
