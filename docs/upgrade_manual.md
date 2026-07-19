# Manuel de Mise à Jour

Ce document décrit les procédures pour appliquer des mises à jour applicatives et d'infrastructure.

---

## Mise à jour du Code et des Dépendances (CI/CD)

- **Mise à jour locale des dépendances** :
  ```bash
  npm update && npm run test
  ```
- **Mise à jour automatique par Dependabot** : Les analyses de sécurité hebdomadaires génèrent des Pull Requests. Si les vérifications de la CI sont au vert (statut de build vert), la PR peut être fusionnée directement.
- **Déclenchement du build d'images** : Créez et poussez un tag Git pour compiler et publier automatiquement la version :
  ```bash
  git tag v2.1.0
  git push origin v2.1.0
  ```

---

## Déploiement et Migration (Kubernetes/Helm)

Le déploiement continu applique la nouvelle version de manière progressive sur le cluster AKS.

- **Mise à jour progressive (Rolling Update)** :
  ```bash
  helm upgrade --install todo-app ./k8s/todo-app \
    --namespace production \
    -f ./k8s/todo-app/values-prod.yaml \
    --set client.image.tag="v2.1.0" \
    --set backend.image.tag="v2.1.0" \
    --set auth.image.tag="v2.1.0"
  ```
- **Migrations SQL Automatiques** : Les microservices exécutent leurs migrations Knex au démarrage (`await db.migrate.latest()`). Les modifications structurelles de la base sont appliquées automatiquement sans script SQL manuel.

---

## Vérification & Procédure de Retour Arrière (Rollback)

- **Vérifier le statut du déploiement** :
  ```bash
  kubectl rollout status deployment/backend -n production
  ```
- **Annuler la mise à jour (Rollback)** : Si une anomalie bloquante est détectée, restaurez instantanément la version précédente stable :
  1.  Listez l'historique des déploiements Helm :
      ```bash
      helm history todo-app --namespace production
      ```
  2.  Restaurez la version précédente (ex: révision 12) :
      ```bash
      helm rollback todo-app 12 --namespace production
      ```
