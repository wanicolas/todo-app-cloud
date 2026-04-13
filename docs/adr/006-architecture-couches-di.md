# ADR-006 : Architecture en couches avec injection de dépendances

**Date** : avril 2026
**Statut** : Accepté

## Contexte

Le backend avait toute sa logique dans les route handlers qui importaient directement le module `persistence`. Ce couplage fort rendait le code difficile à tester (obligation de mocker les modules) et impossible à étendre sans modifier les routes. Le sujet demande une architecture routeur/contrôleur → service → repository.

## Décision

On a découpé le backend en 3 couches :

- **Routes** (contrôleurs) : reçoivent les requêtes HTTP, délèguent au service, renvoient la réponse. Chaque route est une factory qui reçoit le service en paramètre.
- **Service** (`TodoService`) : contient la logique métier (génération d'UUID, orchestration). Reçoit le repository par injection dans le constructeur.
- **Repository** : accès aux données. 3 implémentations d'une même interface `TodoRepository` :
  - `SqliteRepository` — stockage fichier, utilisé en local
  - `MysqlRepository` — stockage en base, utilisé avec Docker
  - `InMemoryRepository` — stockage en mémoire, utilisé dans les tests du service

L'injection de dépendances se fait par constructeur, sans framework. Le câblage est dans `index.ts` : une factory `createRepository()` choisit l'implémentation selon l'environnement (`MYSQL_HOST`), puis on construit `TodoService` → `createApp()`.

## Conséquences

- Les tests unitaires des routes passent un mock du service directement, sans `jest.mock()` — plus simple et plus explicite
- On peut tester le service avec `InMemoryRepository` sans toucher au disque ni au réseau
- Ajouter un nouveau backend de stockage revient à créer une classe qui implémente `TodoRepository`
- Le nombre de fichiers augmente (3 → 8 dans le backend) mais chaque fichier a une seule responsabilité
