#import "@preview/cmarker:0.1.10": render
#import "@preview/merman:0.1.0": mermaid

// Fonction pour nettoyer le Markdown avant le rendu (supprime H1 et lignes horizontales)
#let render-clean-md(path) = {
  let content = read(path)
  content = content.replace(regex("(?m)^# [^\n]*\n+"), "")
  content = content.replace(regex("(?m)^---\n+"), "")
  render(content, scope: (
    image: (img-path, alt: none) => {
      // Extrait le nom du fichier image et force la résolution relative à report.typ (dossier ../images)
      let filename = img-path.split("/").last()
      image("../images/" + filename, alt: alt)
    },
  ))
}

// Paramètres généraux du document
#set document(title: "Concevoir et développer des applications logicielles - Todo App Cloud", author: "Nicolas Walter")
#set text(font: "Hanken Grotesk", size: 10.5pt, fill: rgb("#1a1a1a"))
#set par(justify: true, leading: 0.65em)

// Style des titres
#show heading: set text(fill: rgb("#000000"), font: "Hanken Grotesk")
#show heading.where(level: 1): set text(size: 20pt, weight: "bold")
#show heading.where(level: 1): set block(width: 100%, below: 1.5em, above: 2em)

#show heading.where(level: 2): set text(size: 14pt, weight: "bold")
#show heading.where(level: 2): set block(width: 100%, below: 1em, above: 1.5em)

#show heading.where(level: 3): set text(size: 12pt, weight: "bold")
#show heading.where(level: 3): set block(width: 100%, below: 0.8em, above: 1.2em)

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
  align(center)[
    #mermaid(it.text)
  ]
}

// -------------------------------------------------------------
// PAGE DE GARDE
// -------------------------------------------------------------
#page(header: none, footer: none)[
  #align(center)[
    #text(size: 14pt)[#upper("Nicolas Walter")]
  ]

  #v(1fr)

  #align(center)[
    #set par(justify: false)
    #text(
      size: 26pt,
      weight: "bold",
      hyphenate: false,
    )[Concevoir et développer des applications logicielles]
    #v(1em)
    #text(size: 14pt, style: "italic")[Projet : Todo App Cloud]
    #v(2em)
    #rect(width: 40%, height: 0.5pt, fill: rgb("#888888"))
    #v(2em)
    #text(size: 12pt)[
      *École :* Ynov Campus Strasbourg \
      *Formation :* Mastère 2 Expert en Développement Full Stack \
      *Réf. Évaluation :* Bloc 2 (Certification RNCP39583)
    ]
  ]

  #v(1fr)

  #align(center)[
    #text(size: 12pt)[20 Juillet 2026]
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

Ce dossier technique présente le travail de conception, de développement, de sécurisation et de déploiement réalisé sur l'application *Todo App Cloud*. L'objectif de ce projet est de transformer une application de démonstration locale en une architecture microservices prête pour le Cloud (Cloud-Ready), robuste, hautement disponible, sécurisée selon les principes DevSecOps, accessible, et instrumentée pour le suivi de performance.

Ce projet valide les compétences du *Bloc 2 (Concevoir et développer des applications logicielles)* pour la certification professionnelle. Afin de guider le jury d'évaluation, le tableau ci-dessous établit la correspondance directe entre les compétences du référentiel et les chapitres de ce dossier :

#v(1em)
#align(center)[
  #table(
    columns: (auto, 1fr),
    fill: (x, y) => if y == 0 { rgb("#eaeaea") } else { none },
    stroke: 0.5pt + rgb("#d0d0d0"),
    [*Compétence RNCP évaluée*], [*Chapitres du rapport associés*],
    [C2.1.1 (Déploiement, performance et qualité)], [Chapitre 2 (Qualité/SLA) & Chapitre 5 (Déploiement Helm)],
    [C2.1.2 (Intégration continue)], [Chapitre 2 (Protocole d'intégration continue CI)],
    [C2.2.1 (Prototype, architecture et paradigmes)], [Chapitre 1 (Bounded Contexts, Prototype & Architecture interne)],
    [C2.2.2 (Harnais de test unitaire)], [Chapitre 2 (Conception du harnais de test unitaire Jest)],
    [C2.2.3 (Sécurité et accessibilité)], [Chapitre 3 (Sécurité OWASP/Cloud) & Chapitre 4 (Accessibilité A11y)],
    [C2.2.4 (Gestion de versions et CD)], [Chapitre 5 (Déploiement continu CD) & Chapitre 8 (Historique des versions)],
    [C2.3.1 (Cahier de recettes)], [Chapitre 6 (Cahier de recettes)],
    [C2.3.2 (Plan de correction des bogues)], [Chapitre 7 (Plan de correction des bogues)],
    [C2.4.1 (Documentation et manuels techniques)],
    [Chapitre 8 (Manuels d'utilisation, de mise à jour, d'exploitation)],
  )
]

#pagebreak()

= Architecture Logicielle, Modèle Métier & Prototype

== Cartographie des Contextes Métier (Bounded Contexts)
#render-clean-md("../context_map.md")

#v(1em)
== Structure Interne des Services (Architecture en couches & DI)
#render-clean-md("../software_architecture.md")

#pagebreak()

= Intégration Continue, Tests & Critères de Qualité

== Protocole d'Intégration Continue (CI)
#render-clean-md("../ci_procedure.md")

#v(1em)
== Critères de Qualité, Performance & Harnais de Tests
#render-clean-md("../performance_criteria.md")

#pagebreak()

= Sécurité Applicative & Cloud (DevSecOps)

#render-clean-md("../security.md")

#pagebreak()

= Accessibilité Numérique (A11y)

#render-clean-md("../accessibility.md")

#pagebreak()

= Protocole de Déploiement Continu (CD) & Infrastructure

#render-clean-md("../deployment_procedure.md")

#pagebreak()

= Recette Applicative & Cahier de Recettes

#render-clean-md("../cahier_recettes.md")

#pagebreak()

= Gestion des Anomalies & Plan de Correction

#render-clean-md("../plan_correction_bogues.md")

#pagebreak()

= Manuels d'Exploitation & Maintenance

Pour assurer la traçabilité et le suivi par les équipes opérationnelles, nous fournissons ici le manuel d'utilisation (incluant les aspects RGPD/droit à l'oubli), le manuel de mise à jour/rollback de l'application, et les fiches reflexes d'exploitation.

== Manuel d'Utilisation
#render-clean-md("../user_manual.md")

#v(2em)

== Manuel de Mise à Jour et Exploitation
#render-clean-md("../upgrade_manual.md")

#v(2em)

== Runbooks d'Exploitation (Fiches Réflexes)
#render-clean-md("../runbooks.md")

#v(2em)

== Historique des Versions (Changelog)
#render-clean-md("../version_history.md")

#v(2em)

== Glossaire Technique
#render-clean-md("../glossaire.md")


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
