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
    #rect(width: 100%, height: 2pt, fill: rgb("#000000"))
    #v(2em)
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
    #v(3em)
    #rect(width: 100%, height: 2pt, fill: rgb("#000000"))
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
    #v(0.5em)
    #line(length: 100%, stroke: 0.5pt + rgb("#d0d0d0"))
  ],
  footer: [
    #line(length: 100%, stroke: 0.5pt + rgb("#d0d0d0"))
    #v(0.5em)
    #align(center)[
      #context {
        let page-num = counter(page).get().first()
        let total-pages = counter(page).final().first()
        text(size: 9pt, fill: rgb("#777777"), font: "Hanken Grotesk")[
          Page #page-num sur #total-pages
        ]
      }
    ]
  ],
)

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

#render(read("docs/context_map.md"))

#pagebreak()

= Maintien des Environnements & Infrastructure (Helm)

Nous décrivons ici la gestion des environnements locaux et cloud, ainsi que la configuration Helm pour orchestrer les déploiements AKS.

== Déploiement multi-environnement
Nous avons configuré des profils distincts pour isoler le Staging (préproduction économique) et la Production (hautement disponible et sécurisée). Les détails des configurations Helm de ces environnements sont décrits ci-dessous.

#render(read("docs/performance_criteria.md"))

#pagebreak()

= Accessibilité Numérique (A11y)

Conformément à la compétence *C2.2.3*, nous présentons ici les standards choisis (RGAA/OPQUAST) et les mesures prises pour rendre l'application accessible aux personnes en situation de handicap.

#render(read("docs/accessibility.md"))

#pagebreak()

= Protocole de Déploiement Continu (CD)

Nous détaillons ci-dessous le protocole complet de déploiement continu automatisé sur Azure AKS, sécurisé par authentification OIDC.

#render(read("docs/deployment_procedure.md"))

#pagebreak()

= Recette Applicative & Cahier de Recettes

Cette section présente le cahier de recettes validant les fonctionnalités, la sécurité applicative (OWASP) et les performances du logiciel.

#render(read("docs/cahier_recettes.md"))

#pagebreak()

= Gestion des Anomalies & Plan de Correction

Nous décrivons le registre des bogues identifiés lors de la recette applicative et les mesures de correction appliquées.

#render(read("docs/plan_correction_bogues.md"))

#pagebreak()

= Manuels d'Exploitation & Maintenance

Pour assurer la traçabilité et le suivi par les équipes opérationnelles, nous fournissons ici le manuel d'utilisation (incluant les aspects RGPD/droit à l'oubli) et le manuel de mise à jour/rollback de l'application.

== Manuel d'Utilisation
#render(read("docs/user_manual.md"))

#v(2em)

== Manuel de Mise à Jour et Exploitation
#render(read("docs/upgrade_manual.md"))

#v(2em)

== Runbooks d'Exploitation
#render(read("docs/runbooks.md"))

#v(2em)

== Glossaire Technique
#render(read("docs/glossaire.md"))

