#import "@preview/cmarker:0.1.10": render
#import "@preview/mmdr:0.2.2": mermaid

// Paramètres généraux du document
#set document(title: "CONCEVOIR ET DEVELOPPER DES APPLICATIONS LOGICIELLES - Todo App Cloud", author: "Nicolas Walter")
#set text(font: "Hanken Grotesk", size: 10.5pt, fill: rgb("#1a1a1a"))
#set par(justify: true, leading: 0.65em)

// Style des titres
#show heading: set text(fill: rgb("#000000"), font: "Hanken Grotesk")
#show heading.where(level: 1): it => block(width: 100%, below: 1.5em, above: 2em)[
  #text(size: 20pt, weight: "bold")[#it.body]
]
#show heading.where(level: 2): it => block(width: 100%, below: 1em, above: 1.5em)[
  #text(size: 14pt, weight: "bold")[#it.body]
]
#show heading.where(level: 3): it => block(width: 100%, below: 0.8em, above: 1.2em)[
  #text(size: 12pt, weight: "bold")[#it.body]
]

// Style des liens
#show link: set text(fill: rgb("#0055cc"))

// Style des blocs de code
#show raw: set text(font: "JetBrains Mono", size: 9pt)
#show raw.where(block: true): it => block(
  fill: rgb("#f7f7f7"),
  inset: 10pt,
  radius: 3pt,
  width: 100%,
  stroke: 0.5pt + rgb("#e5e5e5"),
  it,
)

// Intercept and Render Mermaid diagrams
#show raw.where(lang: "mermaid"): it => {
  mermaid(it.text)
}

// -------------------------------------------------------------
// PAGE DE GARDE
// -------------------------------------------------------------
#page(header: none, footer: none)[
  #align(center + horizon)[
    #text(size: 14pt, weight: "light")[Nicolas Walter]
    #v(2pt)
    #text(size: 26pt, weight: "bold")[Concevoir et développer des applications logicielles]
    #v(1em)
    #text(size: 14pt, style: "italic")[Projet : Todo App Cloud]
    #v(2em)
    #rect(width: 40%, height: 0.5pt, fill: rgb("#888888"))
    #v(2em)
    #text(size: 12pt)[
      *Candidat :* Nicolas Walter \
      *Formation :* Mastère 2 Expert en Développement Full Stack \
      *École :* Ynov Informatique \
      *Date :* 20 Juillet 2026 \
      *Réf. Évaluation :* Bloc 2 (Certification RNCP39583)
    ]
  ]
]

// Style de la page pour le reste du document
#set page(
  paper: "a4",
  margin: (x: 2.5cm, top: 3cm, bottom: 3cm),
  header: [
    #grid(
      columns: (1fr, auto),
      text(size: 8.5pt, fill: rgb("#777777"), font: "Hanken Grotesk")[Dossier Technique (Bloc 2) — Todo App Cloud],
      text(size: 8.5pt, fill: rgb("#777777"), font: "Hanken Grotesk")[Nicolas Walter],
    )
    #line(length: 100%, stroke: 0.5pt + rgb("#d0d0d0"))
  ],
  footer: [
    #line(length: 100%, stroke: 0.5pt + rgb("#d0d0d0"))
    #grid(
      columns: (1fr, 1fr, 1fr),
      align(left)[#text(size: 8pt, fill: rgb("#999999"), font: "Hanken Grotesk")[Document d'évaluation]],
      align(center)[
        #context {
          let page-num = counter(page).get().first()
          let total-pages = counter(page).final().first()
          text(size: 9pt, fill: rgb("#777777"), font: "Hanken Grotesk")[
            Page #page-num sur #total-pages
          ]
        }
      ],
      align(right)[#text(size: 8pt, fill: rgb("#999999"), font: "Hanken Grotesk")[Année 2025-2026]],
    )
  ],
)

// -------------------------------------------------------------
// RÉSUMÉ EXÉCUTIF
// -------------------------------------------------------------
#page(header: none)[
  #v(2em)
  #text(size: 18pt, weight: "bold")[Résumé Exécutif]
  #v(1.5em)
  Ce dossier technique détaille la refonte Cloud-Native et DevSecOps de l'application #link("https://github.com/docker/getting-started-todo-app")[Todo App] des tutoriels Docker. Réalisé dans le cadre scolaire durant les cours "Développer pour le cloud" et amélioré pour la certification RNCP (Bloc 2), ce projet démontre la maîtrise d'une architecture microservices complète.

  *Stack Technique & Approche :*
  - *Développement :* Frontend React, Backend et Auth en Node.js (Express/Knex), avec typage strict (TypeScript).
  - *Infrastructure (IaC) :* Provisionnement Azure via Terraform (Cluster AKS, Registre ACR, KeyVault, MySQL Managé).
  - *Sécurité (Zero Trust) :* Authentification OIDC (sans mot de passe), RBAC Azure, secrets montés via CSI driver, réseaux virtuels (VNet) et bases de données isolées d'Internet.
  - *Qualité & CI/CD :* Couverture par tests unitaires (Jest, Vitest) et End-to-End (Playwright), scans de vulnérabilités (Trivy, Dependabot) et déploiement continu automatisé (GitHub Actions) via Helm.

  Le résultat est une solution logicielle hautement disponible, résiliente, conforme aux exigences de sécurité de l'OWASP Top 10 et aux standards d'accessibilité.
  #pagebreak()
]

// -------------------------------------------------------------
// TABLE DES MATIÈRES
// -------------------------------------------------------------
#page(header: none)[
  #v(2em)
  #text(size: 18pt, weight: "bold")[Table des Matières]
  #v(1.5em)
  #outline(title: none, indent: 1.5em)
]

#set heading(numbering: "1.1.")

// -------------------------------------------------------------
// SECTIONS INTERNES
// -------------------------------------------------------------

= Introduction

Ce dossier technique présente le travail de conception, de développement et de sécurisation réalisé sur l'application *Todo App*. L'objectif de ce projet était de transformer une application de démonstration locale en une architecture microservices prête pour le Cloud (Cloud-Ready), robuste, sécurisée selon les principes DevSecOps, accessible, et instrumentée pour le suivi de performance.

Ce projet valide les compétences du *Bloc 2 (Concevoir et développer des applications logicielles)* pour la certification professionnelle.

#pagebreak()

= Architecture Logicielle & Choix Technologiques

Dans cette section, nous présentons la structure globale du monorepo, l'organisation en microservices, les technologies utilisées et le détail de notre cartographie applicative.

#render(read("../context_map.md"))

#pagebreak()

= Maintien des Environnements & Infrastructure (Helm)

Nous décrivons ici la gestion des environnements locaux et cloud, ainsi que la configuration Helm pour orchestrer les déploiements AKS.

== Déploiement multi-environnement
Nous avons configuré des profils distincts pour isoler le Staging (préproduction économique) et la Production (hautement disponible et sécurisée). Les détails des configurations Helm de ces environnements sont décrits ci-dessous.

#render(read("../performance_criteria.md"))

#pagebreak()

= Accessibilité Numérique (A11y)

Conformément à la compétence *C2.2.3*, nous présentons ici les standards choisis (RGAA/OPQUAST) et les mesures prises pour rendre l'application accessible aux personnes en situation de handicap.

#render(read("../accessibility.md"))

#pagebreak()

= Protocole de Déploiement Continu (CD)

Nous détaillons ci-dessous le protocole complet de déploiement continu automatisé sur Azure AKS, sécurisé par authentification OIDC.

#render(read("../deployment_procedure.md"))

#pagebreak()

= Recette Applicative & Cahier de Recettes

Cette section présente le cahier de recettes validant les fonctionnalités, la sécurité applicative (OWASP) et les performances du logiciel.

#render(read("../cahier_recettes.md"))

#pagebreak()

= Gestion des Anomalies & Plan de Correction

Nous décrivons le registre des bogues identifiés lors de la recette applicative et les mesures de correction appliquées.

#render(read("../plan_correction_bogues.md"))

#pagebreak()

= Manuels d'Exploitation & Maintenance

Pour assurer la traçabilité et le suivi par les équipes opérationnelles, nous fournissons ici le manuel d'utilisation (incluant les aspects RGPD/droit à l'oubli) et le manuel de mise à jour/rollback de l'application.

== Manuel d'Utilisation
#render(read("../user_manual.md"))

#v(2em)

== Manuel de Mise à Jour et Exploitation
#render(read("../upgrade_manual.md"))

#v(2em)

== Runbooks d'Exploitation
#render(read("../runbooks.md"))

#v(2em)

== Glossaire Technique
#render(read("../glossaire.md"))

// -------------------------------------------------------------
// PAGE DE FIN (4ème de couverture)
// -------------------------------------------------------------
#pagebreak()
#page(header: none, footer: none)[
  #align(center + horizon)[
    #text(size: 20pt, weight: "bold", fill: rgb("#1a1a1a"))[Merci de votre lecture.]
    #v(3em)
    #rect(width: 30%, height: 0.5pt, fill: rgb("#888888"))
    #v(3em)
    #text(size: 12pt)[
      *Candidat :* Nicolas Walter \
      *Projet :* Todo App Cloud \
      *Certification :* Bloc 2 - RNCP39583
    ]
    #v(2em)
    #link("https://github.com/wanicolas/todo-app-cloud")[#text(
      size: 11pt,
    )[Consulter le code source sur GitHub]]

    #v(6em)
    #text(size: 9pt, fill: rgb("#888888"))[
      Ce document a été généré automatiquement à partir de la documentation interne en Markdown du projet \
      (Approche _Documentation as Code_) et compilé avec le moteur de composition #link("https://typst.app")[Typst].
    ]
  ]
]
