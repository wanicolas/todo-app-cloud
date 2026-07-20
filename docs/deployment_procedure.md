# Procédure de Déploiement

Ce guide détaille le protocole de déploiement continu automatisé sur Azure AKS.

## Prérequis et Initialisation (IaC)

- **Outils requis** : Azure CLI (`az` connecté via `az login`), Terraform, Helm (v3) et Docker.
- **Provisionnement de l'infrastructure (Azure)** :
  ```bash
  cd azure
  terraform init
  terraform apply -auto-approve
  ```
  _Notez les valeurs de sorties (outputs) générées : `resource_group_name`, `kubernetes_cluster_name`, `container_registry_name`, `key_vault_name` et `mysql_server_name`._

## Construction et Publication des Conteneurs (ACR)

Connectez-vous au registre privé Azure Container Registry (ACR) pour compiler et pousser les images de production :

```bash
# Connexion au registre
az acr login --name <NOM_ACR>

# Compilation et push matriciel
docker build -t <NOM_ACR>.azurecr.io/backend:latest ./backend
docker build -t <NOM_ACR>.azurecr.io/auth:latest ./auth
docker build -t <NOM_ACR>.azurecr.io/client:latest ./client

docker push <NOM_ACR>.azurecr.io/backend:latest
docker push <NOM_ACR>.azurecr.io/auth:latest
docker push <NOM_ACR>.azurecr.io/client:latest
```

## Déploiement applicatif (Helm)

### Déploiement Local (Test)

```bash
helm upgrade --install todo-app ./k8s/todo-app -f ./k8s/todo-app/values-test.yaml
```

### Déploiement en Production (Azure AKS)

Connectez-vous au cluster AKS, générez le certificat TLS pour le proxy, et déployez à l'aide de Helm :

```bash
# Connexion au cluster AKS
az aks get-credentials --resource-group <NOM_RG> --name <NOM_AKS>

# Génération et chargement du certificat TLS
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt -subj "/CN=todo.localhost"
kubectl create secret tls todo-tls-cert --key tls.key --cert tls.crt

# Déploiement Helm de Production
helm upgrade --install todo-app ./k8s/todo-app \
  -f ./k8s/todo-app/values-prod.yaml \
  --set mysql.host="<DNS_MYSQL>" \
  --set mysql.authHost="<DNS_MYSQL>" \
  --set keyvault.name="<NOM_KEY_VAULT>" \
  --set keyvault.tenantId="<TENANT_ID>" \
  --set keyvault.clientId="<KEYVAULT_CLIENT_ID>" \
  --set client.image.repository="<NOM_ACR>.azurecr.io/client" \
  --set backend.image.repository="<NOM_ACR>.azurecr.io/backend" \
  --set auth.image.repository="<NOM_ACR>.azurecr.io/auth"
```

_Vérifiez le statut avec `kubectl get pods` et obtenez l'IP publique du proxy via `kubectl get svc reverse-proxy`._

## Déploiement Continu Automatisé (CD GitHub Actions)

Le pipeline de CD automatisé est configuré dans [.github/workflows/cd.yml](file:///.github/workflows/cd.yml).

### Sécurisation de l'intégration par OIDC (OpenID Connect)

Le pipeline n'utilise aucun secret statique d'API (mot de passe). Il s'appuie sur une fédération d'identité temporaire d'Azure Entra ID :

1.  **Service Principal** : Créé avec les droits de contributeur sur le groupe de ressources.
2.  **Federated Credentials** : Une relation de confiance est configurée sur le portail Azure pour l'organisation GitHub, liée à la branche `main` (staging) et aux tags `v*` (production).
3.  **Secrets GitHub** : Seuls les identifiants publics sont configurés dans les variables GitHub (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `ACR_NAME`, `RESOURCE_GROUP`, `CLUSTER_NAME`).

### Déclenchement du pipeline (GitFlow)

- **Déploiement en Staging (Automatique)** : Tout push ou merge réussi sur `main` déploie l'application dans le namespace `staging` (BDD locale éphémère, pas de Key Vault).
- **Déploiement en Production (Automatique)** : La création d'un tag de version correspondant au format `v*` (ex: `v2.1.0`) compile, scanne via Trivy, et déploie dans le namespace `production` (BDD MySQL managée isolée, Key Vault CSI Secrets active).
