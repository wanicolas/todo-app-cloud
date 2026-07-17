# Manuel de Mise à Jour - Todo App Cloud

Ce document décrit les procédures pour appliquer des mises à jour applicatives et d'infrastructure sur le projet **Todo App Cloud** en production.

## 1. Mise à Jour du Code et des Dépendances

Lorsqu'une nouvelle version de l'application est prête à être déployée :

### A. Mettre à jour les dépendances NPM

1. Accédez au dossier du microservice (ex: `backend/` ou `auth/`).
2. Lancez la mise à jour des packages non-bloquants :
   ```bash
   npm update
   ```
3. Validez la mise à jour en exécutant la suite de tests unitaires :
   ```bash
   npm run test
   ```

### B. Mises à jour de sécurité automatisées (Dependabot)

Dependabot scanne le dépôt chaque semaine. En cas de PR ouverte par le bot :

1. Laissez le pipeline de CI exécuter les tests unitaires sur la PR.
2. Si le statut de build de la PR est vert, fusionnez (merge) la PR.

## 2. Compilation et Publication des Images Docker

Pour générer les nouvelles images de production suite à une modification du code :

1. Créez un tag de version Git (ex: `v2.1.0`) et poussez-le sur le dépôt :
   ```bash
   git tag v2.1.0
   git push origin v2.1.0
   ```
2. Le pipeline de CD GitHub Actions se déclenche automatiquement. Il va :
   - Vérifier quels répertoires ont changé (optimisation par filtre de chemins).
   - Compiler uniquement les images modifiées et retaguer les autres.
   - Lancer un scan de sécurité Trivy sur les images.
   - Pousser les images sur l'Azure Container Registry (ACR).

## 3. Déploiement et Migration de la Base de Données (Kubernetes/Helm)

Le déploiement s'appuie sur Helm pour orchestrer la mise à jour sur le cluster AKS.

### A. Déploiement via la CD (Automatique)

Une fois les images poussées sur l'ACR, le pipeline de CD lance automatiquement la commande Helm de mise à jour progressive (Rolling Update) :

```bash
helm upgrade --install todo-app ./k8s/todo-app \
  --namespace production \
  -f ./k8s/todo-app/values-prod.yaml \
  --set client.image.tag="v2.1.0" \
  --set backend.image.tag="v2.1.0" \
  --set auth.image.tag="v2.1.0"
```

### B. Migrations de base de données automatiques

Les microservices backend et auth exécutent leurs migrations Knex automatiquement lors du démarrage du conteneur (`await db.migrate.latest()`). Aucun script SQL manuel n'est requis. Si une modification de structure de base de données (ajout de table, colonne) est incluse dans la mise à jour, elle sera appliquée lors du démarrage du nouveau pod.

## 4. Vérification et Rétrogradation (Rollback)

### A. Valider que la mise à jour a réussi

Pour s'assurer que les nouveaux conteneurs ont démarré correctement sans interruption de service (Zero-Downtime) :

```bash
kubectl rollout status deployment/backend -n production
kubectl rollout status deployment/auth -n production
kubectl rollout status deployment/client -n production
```

### B. Effectuer un retour arrière (Rollback)

Si une anomalie bloquante est détectée après le déploiement, vous pouvez instantanément annuler la mise à jour et restaurer la version précédente de Helm :

1. Listez l'historique des déploiements pour identifier le numéro de révision précédent :
   ```bash
   helm history todo-app --namespace production
   ```
2. Restaurez la version précédente (ex: révision 12) :
   ```bash
   helm rollback todo-app 12 --namespace production
   ```
3. Vérifiez le statut pour confirmer le retour à l'état stable.
