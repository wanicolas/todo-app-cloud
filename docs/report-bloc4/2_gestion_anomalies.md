## 2.1. Processus de Collecte et Consignation (C4.2.1)

Lorsqu'une anomalie survient en production, sa résolution rapide dépend de la qualité des informations collectées.

### 2.1.1. Outils de Collecte (Exceptions & Logs)

Afin de ne rater aucune erreur applicative, la collecte est divisée sur deux niveaux :

- **Côté Frontend (React) :** Le SDK **Sentry** est intégré. Il capture automatiquement les erreurs JavaScript, les échecs de rendu (Error Boundaries) et l'état du navigateur, remettant au développeur une vue exacte du crash sans action de l'utilisateur.
- **Côté Backend (Express) :** Toutes les erreurs non gérées (Exceptions, rejets de promesses) sont capturées globalement par un middleware et transmises via Winston à **Azure Application Insights**. Les logs incluent l'horodatage, la Stacktrace et l'ID de corrélation (Trace ID).

### 2.1.2. Fiche de Consignation (Exemple de Bug)

**ID du Ticket :** INC-1042  
**Titre :** Déconnexion intempestive des utilisateurs après 1 heure.  
**Environnement concerné :** Production (v2.1.0)  
**Navigateur/Client :** Tous les navigateurs  
**Sévérité :** Majeure (Impact direct sur l'expérience utilisateur).  
**Description :** Les utilisateurs signalent qu'ils sont redirigés vers la page de connexion alors qu'ils sont en pleine saisie de tâches, exactement 60 minutes après leur connexion initiale.  
**Étapes de reproduction :**

1. Se connecter à l'application.
2. Attendre 61 minutes.
3. Tenter d'ajouter une tâche. L'API retourne une erreur `401 Unauthorized`.

**Analyse initiale :**
L'examen du code du microservice d'authentification (`AuthService.ts`) révèle que le paramètre `expiresIn` du JSON Web Token (JWT) est codé en dur à `"1h"`. L'application frontend ne possède actuellement aucun mécanisme de rafraîchissement de jeton (Refresh Token) en arrière-plan.

## 2.2. Traitement et Déploiement du Correctif (C4.2.2)

### 2.2.1. Élaboration et Code du Correctif

Pour résoudre le ticket INC-1042 de manière robuste sans compromettre la sécurité, deux modifications ont été apportées dans le code source :

1. **Extension configurable de la durée de vie du JWT :** Dans `AuthService.ts`, la variable `expiresIn` s'appuie désormais sur une variable d'environnement avec une valeur par défaut de `"12h"` (adaptée à une journée de travail) au lieu de `"1h"`.

```typescript
// Extrait de AuthService.ts - Correctif de la durée de validité du jeton
private get expiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '12h';
}

private sign(user: User): string {
    return jwt.sign({ sub: user.id, email: user.email }, this.secret, {
        expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'],
    });
}
```

2. **Intercepteur d'erreur HTTP 401 côté Frontend :** Le client React a été mis à jour pour intercepter automatiquement la réponse `401 Unauthorized` et rediriger l'utilisateur vers la page de connexion de manière propre.

### 2.2.2. Test de Non-Régression Automatisé

Pour garantir que cette régression ne réapparaisse jamais, un test unitaire et d'intégration automatisé a été ajouté dans la suite Jest du service d'authentification (`AuthService.test.ts`) :

```typescript
describe("AuthService - JWT Expiration Hotfix Test", () => {
  it("should generate a JWT token valid for 12h by default", async () => {
    const { token } = await authService.login(
      "user@example.com",
      "Password123!",
    );
    const decoded = jwt.decode(token) as { exp: number; iat: number };

    // Vérification de la durée de validité (12 heures = 43200 secondes)
    const durationInSeconds = decoded.exp - decoded.iat;
    expect(durationInSeconds).toBe(12 * 3600);
  });
});
```

### 2.2.3. Déploiement via CI/CD

Le correctif a été développé sur la branche `hotfix/jwt-expiration`.

1. **Intégration Continue (CI) :** Lors de la création de la Pull Request, le pipeline GitHub Actions a exécuté la totalité des tests (`npm test`, Lint, Types). Le test automatisé ci-dessus s'est exécuté avec succès.
2. **Déploiement Continu (CD) :** Après revue de code, la PR a été fusionnée sur `main`. Le pipeline CD a compilé la version `v2.1.1` des images Docker, validé la sécurité avec Trivy, et mis à jour le cluster AKS via Helm.
3. **Zéro Coupure :** Grâce au `Rolling Update` de Kubernetes, les nouveaux pods ont été déployés progressivement sans interruption de service.
