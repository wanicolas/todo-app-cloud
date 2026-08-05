## 2.1. Processus de Collecte et Consignation (C4.2.1)

Lorsqu'une anomalie survient en production, sa résolution rapide dépend de la qualité des informations collectées.

### 2.1.1. Outils de Collecte (Exceptions & Logs)
Afin de ne rater aucune erreur applicative, la collecte est divisée sur deux niveaux :
- **Côté Frontend (React) :** Le SDK **Sentry** est intégré. Il capture automatiquement les erreurs JavaScript, les échecs de rendu (Error Boundaries) et l'état du navigateur, remettant au développeur une vue exacte du crash sans action de l'utilisateur.
- **Côté Backend (Express) :** Toutes les erreurs non gérées (Exceptions, rejets de promesses) sont capturées globalement par un middleware et transmises via Winston à **Azure Application Insights**. Les logs incluent l'horodatage, la Stacktrace et l'ID de corrélation (Trace ID).


### 2.1.2. Fiche de Consignation (Exemple de Bug)
**ID du Ticket :** INC-1042  
**Titre :** Déconnexion intempestive des utilisateurs après 1 heure.  
**Sévérité :** Majeure (Impact direct sur l'expérience utilisateur).  
**Description :** Les utilisateurs signalent qu'ils sont redirigés vers la page de connexion alors qu'ils sont en pleine saisie de tâches, exactement 60 minutes après leur connexion initiale.  
**Étapes de reproduction :** 
1. Se connecter à l'application.
2. Attendre 61 minutes.
3. Tenter d'ajouter une tâche. L'API retourne une erreur `401 Unauthorized`.  

**Analyse initiale :** 
L'examen du code du microservice d'authentification (`AuthService.ts`) révèle que le paramètre `expiresIn` du JSON Web Token (JWT) est codé en dur à `"1h"`. L'application frontend ne possède actuellement aucun mécanisme de rafraîchissement de jeton (Refresh Token) en arrière-plan.

## 2.2. Traitement et Déploiement du Correctif (C4.2.2)

### 2.2.1. Élaboration du Correctif
Pour résoudre le ticket INC-1042 de manière robuste sans compromettre la sécurité, deux modifications ont été apportées :
1. **Extension raisonnable de la durée de vie :** Le JWT passe à une validité de `"12h"` (journée de travail standard).
2. **Gestion gracieuse côté client :** Le frontend React a été mis à jour pour intercepter les erreurs HTTP `401`. Au lieu de bloquer brutalement l'interface, l'utilisateur reçoit une notification "Votre session a expiré", sauvegarde l'état local, et est redirigé vers `/login`.

### 2.2.2. Déploiement via CI/CD
Le correctif a été développé sur une branche `hotfix/jwt-expiration`. 
1. **Intégration Continue (CI) :** Lors de la création de la Pull Request, le pipeline GitHub Actions a exécuté les tests (Lint, Types, Jest). Un nouveau test E2E a été ajouté pour valider spécifiquement le comportement d'un jeton expiré.
2. **Déploiement Continu (CD) :** Après validation par un pair, la PR a été fusionnée sur `main`. Le pipeline CD a automatiquement compilé les nouvelles images Docker (v2.1.1), scanné via Trivy pour s'assurer de l'absence de régression de sécurité, puis mis à jour le cluster AKS via Helm.
3. **Zéro Coupure :** Grâce au `Rolling Update` de Kubernetes, les nouveaux pods ont été démarrés avant de couper les anciens, garantissant aucune interruption de service pour les utilisateurs actifs durant le patch.
