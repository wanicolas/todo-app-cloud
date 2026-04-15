# ADR-008 : Scan de vulnérabilités avec Trivy

**Date** : avril 2026
**Statut** : Accepté

## Contexte

Les images Docker utilisées en production peuvent contenir des vulnérabilités connues (CVE) dans les packages système ou les dépendances Node.js. Le sujet demande de mettre en place un scan de sécurité des images.

## Décision

On a intégré **Trivy** (par Aqua Security) dans la CI via `aquasecurity/trivy-action`. Un nouveau workflow `ci-trivy.yml` scanne les 3 images Docker du projet (backend, client, production) à chaque push sur main/develop et sur les PR vers main.

Configuration choisie :
- **Sévérité** : CRITICAL et HIGH uniquement — les vulnérabilités LOW/MEDIUM génèrent trop de bruit sur des images Node.js
- **Mode informatif** : le scan ne bloque pas le build (`exit-code: 0`). L'objectif est de donner de la visibilité, pas de bloquer le développement. On pourra durcir plus tard.
- **Format table** : sortie lisible directement dans les logs GitHub Actions

## Conséquences

- Chaque push déclenche un scan de sécurité visible dans l'onglet Actions de GitHub
- Les vulnérabilités critiques sont détectées avant le déploiement
- Le scan ajoute ~2-3 minutes au pipeline CI (build des 3 images + scan)
