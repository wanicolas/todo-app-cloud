# Runbooks d'Exploitation

Ce document rassemble les fiches de maintenance rapide pour diagnostiquer et rétablir le service.

## Fiche 1 : Service indisponible (Erreur 502/504 - Pod Crash)

### Diagnostic

Vérifiez l'état des pods Kubernetes et affichez les logs du service défaillant :

```bash
kubectl get pods
kubectl logs -f deployment/backend
# ou pour le service d'authentification
kubectl logs -f deployment/auth
```

### Résolution (Redémarrage progressif)

Forcez un redémarrage progressif (Rolling Restart) pour recréer des instances saines :

```bash
kubectl rollout restart deployment/backend
kubectl rollout restart deployment/auth
kubectl rollout status deployment/backend
```

## Fiche 2 : Restauration de la Base de Données (Azure MySQL PITR)

La base de données Azure MySQL Flexible Server effectue des sauvegardes automatiques avec une rétention de 7 jours.

### Procédure de restauration (Point-in-Time Restore)

1.  Identifiez l'horodatage cible (ex. `2026-06-24T18:00:00Z`).
2.  Lancer la restauration via Azure CLI (crée un nouveau serveur MySQL) :
    ```bash
    az mysql flexible-server restore \
      --resource-group <NOM_RG> \
      --name <NOM_SERVEUR_RESTOURE> \
      --source-server <NOM_SERVEUR_ORIGINAL> \
      --restore-time "2026-06-24T18:00:00Z"
    ```
3.  Déployez à nouveau avec Helm en modifiant l'hôte pour pointer vers la nouvelle base :
    ```bash
    helm upgrade todo-app ./k8s/todo-app \
      --reuse-values \
      --set mysql.host="<NOM_SERVEUR_RESTOURE>.mysql.database.azure.com" \
      --set mysql.authHost="<NOM_SERVEUR_RESTOURE>.mysql.database.azure.com"
    ```

## Fiche 3 : Montée en charge soudaine (Manual Scaling)

Si l'autoscaling dynamique (HPA) ne réagit pas assez vite, ajustez manuellement le nombre de réplicas :

```bash
# Augmenter à 3 instances
kubectl scale deployment/backend --replicas=3
kubectl scale deployment/auth --replicas=3
```

_Pour pérenniser la configuration, modifiez les clés `replicaCount` dans le fichier `values-prod.yaml` pour le prochain déploiement._
