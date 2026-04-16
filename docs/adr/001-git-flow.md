# ADR-001 : GitHub Flow simplifié

**Date** : mars 2026
**Statut** : Accepté

## Contexte

On est deux sur le projet et on avait besoin d'un process git qui permette de bosser en parallèle sans se marcher dessus, tout en gardant une branche stable pour la prod.

Git Flow classique (avec release, hotfix, etc.) est trop lourd pour un projet de cette taille.

## Décision

On utilise un GitHub Flow simplifié :

- `main` = branche stable, ce qui est livrable
- `develop` = branche de dev, où on merge les features
- Les features sont faites sur des branches et sont mergées via PR dans develop avec CI obligatoire
- Les merges de `develop` vers `main` passent également par une PR avec la CI obligatoire

## Conséquences

- Chaque merge vers main ou develop est validé par les 3 pipelines CI (backend, client, e2e)
- Pas de branche release, on merge develop → main quand c'est stable
- L'historique reste lisible avec des commits conventionnels (feat, fix, chore, ci, test)
