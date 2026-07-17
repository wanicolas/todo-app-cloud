# Runbooks d'Exploitation

Ce document rassemble les fiches de maintenance de base (Runbooks) pour gérer, diagnostiquer et rétablir le service en production en cas d'incident.

---

## Runbook 1 : Service indisponible / Redémarrage d'urgence (Crash Pod)

### Symptôme

Les requêtes vers `/api` ou `/api/auth` retournent des erreurs `502 Bad Gateway` ou `504 Gateway Timeout`.

### Diagnostic

Vérifiez l'état des pods Kubernetes :

```bash
kubectl get pods
```

Si un pod a le statut `CrashLoopBackOff` ou `Error`, affichez ses logs récents :

```bash
kubectl logs -f deployment/backend
# ou pour le service d'authentification
kubectl logs -f deployment/auth
```

### Résolution (Redémarrage propre)

Forcez un redémarrage progressif (Rolling Restart) du service défaillant pour recréer des pods sains :

```bash
kubectl rollout restart deployment/backend
kubectl rollout restart deployment/auth
```

Suivez la progression du redémarrage :

```bash
kubectl rollout status deployment/backend
```

---

## Runbook 2 : Restauration de la Base de Données Azure MySQL

### Contexte

La base managée **Azure Database for MySQL Flexible Server** effectue des sauvegardes automatiques quotidiennes avec une rétention de 7 jours (configurée dans notre Terraform).

### Procédure de restauration (Point-in-Time Restore - PITR)

Si des données ont été corrompues ou supprimées accidentellement, vous devez restaurer le serveur vers un état antérieur stable. Azure ne permet pas d'écraser la base existante ; il crée un nouveau serveur contenant les données restaurées.

1.  **Identifier l'horodatage cible** (ex. `2026-06-24T18:00:00Z`).
2.  **Lancer la restauration via l'Azure CLI** :
    ```bash
    az mysql flexible-server restore \
      --resource-group <NOM_DE_VOTRE_RG> \
      --name <NOM_DU_NOUVEAU_SERVEUR_RESTOURE> \
      --source-server <NOM_DU_SERVEUR_SQL_ORIGINAL> \
      --restore-time "2026-06-24T18:00:00Z"
    ```
3.  **Mettre à jour l'application** :
    Une fois le serveur restauré prêt, effectuez un nouveau déploiement Helm en modifiant l'hôte MySQL pour pointer vers le nouveau DNS restauré :
    ```bash
    helm upgrade todo-app ./k8s/todo-app \
      --reuse-values \
      --set mysql.host="<NOM_DU_NOUVEAU_SERVEUR_RESTOURE>.mysql.database.azure.com" \
      --set mysql.authHost="<NOM_DU_NOUVEAU_SERVEUR_RESTOURE>.mysql.database.azure.com"
    ```

---

## Runbook 3 : Gestion de la montée en charge (Manual Scaling)

### Contexte

Le trafic augmente soudainement, provoquant des ralentissements et des pics d'utilisation CPU/Mémoire sur les pods.

### Diagnostic

Visualisez la charge actuelle sur les pods :

```bash
kubectl top pods
```

### Résolution (Scaling Manuel)

Augmentez temporairement le nombre de réplicas du service backend ou auth :

```bash
# Augmenter à 3 instances du backend
kubectl scale deployment/backend --replicas=3

# Augmenter à 3 instances du service d'authentification
kubectl scale deployment/auth --replicas=3
```

Pour pérenniser ces modifications ou configurer l'auto-scaling automatique (HPA), modifiez les clés `backend.replicaCount` et `auth.replicaCount` dans votre fichier `values-prod.yaml` pour le prochain déploiement Helm.
