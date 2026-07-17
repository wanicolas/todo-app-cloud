# ADR 017 : Adoption du Trunk-Based Development (GitHub Flow)

## Contexte
Le projet utilisait historiquement une stratégie de branching de type *GitFlow* allégé (Feature → `develop` → `main`). 
Avec l'ajout des pipelines d'Intégration Continue (CI) complets et la mise en place d'environnements de pré-production (Staging), maintenir une branche `develop` parallèle à `main` est devenu source de lourdeurs. Cela obligeait à créer deux Pull Requests (PR) successives, doublait le temps d'exécution des tests de CI pour le même code et augmentait le risque de conflits lors des fusions `develop` vers `main`.

Dans le cadre des pratiques modernes (DORA, DevSecOps), la complexité d'une branche `develop` n'est pas justifiée pour un modèle cloud-native et de déploiement en continu.

## Décision
Nous abandonnons *GitFlow* pour passer à un modèle **Trunk-Based Development** (aussi appelé GitHub Flow).
- **Suppression de `develop`** : `main` devient la seule branche principale ("Trunk").
- **Branches de fonctionnalités** : Le développement se fait sur des branches éphémères de type `feature/*`, `fix/*`.
- **Intégration Continue (CI)** : La CI s'exécute à chaque Pull Request ouverte ou mise à jour ciblant `main`.
- **Déploiement Continu (CD)** :
  - **Staging** : Chaque *Merge* sur `main` déclenche le déploiement sur l'environnement de *Staging*.
  - **Production** : Lorsqu'une itération de `main` est prête et validée en Staging, elle est livrée en production via la création d'un Tag Git (ex: `v1.2.0`).

## Conséquences
- **Avantages** :
  - Pipeline allégé et plus rapide.
  - Cycle de développement accéléré (une seule PR pour intégrer une feature).
  - Résolution des conflits au fil de l'eau (tous les développeurs se synchronisent fréquemment sur `main`).
  - L'équipe a la garantie que `main` représente fidèlement le futur de la production.
- **Inconvénients** :
  - Demande une grande rigueur dans l'écriture des tests (la branche `main` ne doit jamais être instable).
  - Les revues de code (PR) doivent être sérieuses avant la fusion sur `main`.

## Statut
Accepté. (Rend l'ADR 001 caduc).
