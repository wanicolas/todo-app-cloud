# Cahier de Recettes - Todo App Cloud

**Statut global** : Validé

Ce document recense l'ensemble des scénarios de test exécutés pour valider le bon fonctionnement technique, fonctionnel et de sécurité de l'application.

## Stratégie de Test & Couverture

L'application s'appuie sur une pyramide des tests automatisés et manuels :

1. **Tests Unitaires & Intégration API (Backend/Auth)** : Écrit en Jest, s'exécutant sur une base SQLite éphémère. (29 tests pour le backend, 23 tests pour l'authentification).
2. **Tests Frontend (Client)** : Écrit en Vitest, simulant le rendu des composants React et le comportement de l'UI. (23 tests).
3. **Tests de Charge & Performance** : Script k6 simulant des parcours utilisateurs sous charge réseau.
4. **Tests de Sécurité** : Scans de vulnérabilités Trivy (images Docker) et Dependabot (code).

## Matrice des Scénarios de Test Fonctionnels

| ID        | Titre du Scénario            | Conditions préalables              | Description des actions                                                                            | Résultat attendu                                                                                  | Statut   |
| :-------- | :--------------------------- | :--------------------------------- | :------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ | :------- |
| **TC-01** | Inscription utilisateur      | Base de données active             | Appeler `POST /api/auth/register` avec un email et un mot de passe valides.                        | Retourne `201 Created` avec le JWT de session.                                                    | **PASS** |
| **TC-02** | Inscription doublon          | Compte `test@example.com` existant | Retenter une inscription avec le même email `test@example.com`.                                    | Retourne `409 Conflict` (sécurité d'unicité).                                                     | **PASS** |
| **TC-03** | Connexion réussie            | Compte existant en base            | Appeler `POST /api/auth/login` avec identifiants corrects.                                         | Retourne `200 OK` et injecte le cookie sécurisé `auth_token` (HttpOnly).                          | **PASS** |
| **TC-04** | Connexion erronée            | -                                  | Tenter une connexion avec un mot de passe incorrect.                                               | Retourne `401 Unauthorized`.                                                                      | **PASS** |
| **TC-05** | Création de tâche            | Utilisateur authentifié            | Cliquer sur "Ajouter une tâche" avec le nom `Acheter du pain`.                                     | Envoi `POST /api/items`. La tâche apparaît instantanément dans l'UI.                              | **PASS** |
| **TC-06** | Validation de saisie         | Utilisateur authentifié            | Tenter de soumettre une tâche avec un nom vide ou de plus de 255 caractères.                       | Le bouton est désactivé ou l'API retourne `400 Bad Request`.                                      | **PASS** |
| **TC-07** | Modification (Toggle)        | Tâche existante                    | Cliquer sur la case à cocher d'une tâche.                                                          | La tâche est marquée comme complétée (`completed: true`) en base et barrée visuellement.          | **PASS** |
| **TC-08** | Suppression de tâche         | Tâche existante                    | Cliquer sur l'icône de corbeille d'une tâche.                                                      | La tâche disparaît de l'affichage. La ligne est supprimée de la base.                             | **PASS** |
| **TC-09** | Isolation des données (IDOR) | Deux utilisateurs A et B actifs    | L'utilisateur A tente de lire ou modifier les tâches de l'utilisateur B via des requêtes directes. | Le serveur renvoie une erreur `403 Forbidden` ou `404 Not Found`.                                 | **PASS** |
| **TC-10** | Suppression de compte (RGPD) | Utilisateur avec 5 tâches en base  | Aller dans "Mon compte" et cliquer sur "Supprimer mon compte".                                     | L'utilisateur est supprimé d'Auth, et toutes ses tâches associées sont purgées (droit à l'oubli). | **PASS** |

## Scénarios de Test de Sécurité (DevSecOps)

| ID         | Cible de Sécurité            | Outil / Procédure              | Risque analysé                                                | Résultat constaté                                                       | Statut   |
| :--------- | :--------------------------- | :----------------------------- | :------------------------------------------------------------ | :---------------------------------------------------------------------- | :------- |
| **SEC-01** | Exfiltration de session      | Console développeur (JS)       | Exfiltration du JWT via une attaque XSS.                      | `document.cookie` ne retourne pas le token (protégé par `HttpOnly`).    | **PASS** |
| **SEC-02** | Injection de dépendances     | Scan Trivy en pipeline CD      | Paquets ou images contenant des vulnérabilités HIGH/CRITICAL. | Build bloqué en cas de faille exploitable non corrigée.                 | **PASS** |
| **SEC-03** | Brute force sur mot de passe | Requêtes répétées sur `/login` | Épuisement de CPU ou découverte de mot de passe.              | Le middleware de rate-limiting bloque l'IP après 5 tentatives échouées. | **PASS** |

## Scénarios de Test de Performance & SLA

| ID          | Métrique testée                         | Outil                         | Seuil (SLA)         | Résultat constaté            | Statut   |
| :---------- | :-------------------------------------- | :---------------------------- | :------------------ | :--------------------------- | :------- |
| **PERF-01** | Temps de réponse API (Lecture/Écriture) | k6 (15 utilisateurs virtuels) | p(95) < 300 ms      | **225,16 ms** (local Docker) | **PASS** |
| **PERF-02** | Taux de réussite des requêtes           | k6 (Scénario nominal complet) | Taux d'erreur < 1 % | **0.00 %** d'erreurs         | **PASS** |
