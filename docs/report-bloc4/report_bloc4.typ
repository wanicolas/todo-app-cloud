#import "@preview/cmarker:0.1.10": render
#import "@preview/merman:0.1.0": mermaid

// Fonction pour nettoyer le Markdown avant le rendu
#let render-clean-md(path, offset: 0) = {
  let content = read(path)
  if content.contains(regex("(?m)^## ")) {
    let parts = content.split(regex("(?m)^## "))
    content = "## " + parts.slice(1).join("## ")
  } else {
    content = content.replace(regex("(?m)^# [^\n]*\n+"), "")
  }

  if offset == 1 {
    content = content.replace(regex("(?m)^#"), "##")
  } else if offset == 2 {
    content = content.replace(regex("(?m)^#"), "###")
  }

  content = content.trim()
  render(content, scope: (
    image: (img-path, alt: none) => {
      let filename = img-path.split("/").last()
      if filename == "account.png" {
        align(center)[#image("../images/" + filename, alt: alt, width: 55%)]
      } else {
        image("../images/" + filename, alt: alt)
      }
    },
  ))
}

#set document(
  title: "Maintenir l'application logicielle en condition opérationnelle - Todo App Cloud",
  author: "Nicolas Walter",
)
#set text(font: "Hanken Grotesk", size: 10.5pt, fill: rgb("#1a1a1a"))
#set par(justify: true, leading: 0.65em)

#show heading: set text(fill: rgb("#000000"))
#show heading: set block(sticky: true)

#show heading.where(level: 1): set text(size: 20pt, weight: "bold", fill: rgb("fff"))
#show heading.where(level: 1): set block(below: 1.5em, above: 2em)
#show heading.where(level: 1): it => block(
  width: 100%,
  fill: rgb("#000000"),
  inset: (x: 0.6em, top: 0.4em, bottom: 0.7em),
  radius: 3pt,
  it,
)

#show heading.where(level: 2): set text(size: 14pt, weight: "bold")
#show heading.where(level: 2): set block(width: 100%, below: 1em, above: 1.5em)

#show heading.where(level: 3): set text(size: 12pt, weight: "light")
#show heading.where(level: 3): set block(width: 100%, below: 0.8em, above: 1.2em)

#show link: set text(fill: rgb("#0055cc"))

#show table: set table(
  fill: (x, y) => if y == 0 { rgb("#eaeaea") } else { none },
  stroke: 0.5pt + rgb("#d0d0d0"),
  align: left,
)
#show table.cell.where(y: 0): strong
#show table: it => {
  set par(justify: false)
  set text(hyphenate: false)
  align(center, it)
}

#show raw: set text(font: "JetBrains Mono", size: 8.5pt)
#show raw.where(block: true): it => block(
  fill: rgb("#fafafa"),
  inset: 6pt,
  radius: 3pt,
  width: 100%,
  stroke: 0.5pt + rgb("#e5e5e5"),
  it,
)

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
    )[
      #upper[#align(left)[Maintenir L'Application]]
      #v(-16pt)
      #upper[#align(right)[En Condition Opérationnelle]]
    ]
    #text(size: 14pt)[Projet : Todo App Cloud]
    #v(2em)
    #line(length: 40%, stroke: 0.5pt + rgb("#888888"))
    #v(2em)
    #text(size: 12pt)[
      *Réf. Évaluation :* Bloc 4 (Certification RNCP39583) \
      *Formation :* Mastère 2 Expert en Développement Full Stack \
      *École :* Ynov Campus Strasbourg \
    ]
  ]

  #v(1fr)

  #align(center)[
    #text(size: 12pt)[#upper("03/08/2026")]
  ]
]

// Style de la page pour le reste du document
#set page(
  paper: "a4",
  margin: 2cm,
  header: move(dy: -8pt)[
    #grid(
      columns: (1fr, auto),
      text(size: 8.5pt, fill: rgb("#777777"))[Dossier Technique (Bloc 4) — Todo App Cloud],
      text(size: 8.5pt, fill: rgb("#777777"))[Nicolas Walter],
    )
    #v(-0.3em)
    #line(length: 100%, stroke: 0.5pt + rgb("#d0d0d0"))
  ],
  footer: move(dy: 8pt)[
    #line(length: 100%, stroke: 0.5pt + rgb("#d0d0d0"))
    #v(-0.3em)
    #grid(
      columns: (1fr, 1fr, 1fr),
      align(left)[#text(size: 8pt, fill: rgb("#999999"))[Document d'évaluation]],
      align(center)[
        #context {
          let page-num = counter(page).get().first()
          let total-pages = counter(page).final().first()
          text(size: 9pt, fill: rgb("#777777"))[
            Page #page-num sur #total-pages
          ]
        }
      ],
      align(right)[#text(size: 8pt, fill: rgb("#999999"))[Année 2025-2026]],
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
  Ce dossier technique détaille la démarche de Maintien en Condition Opérationnelle (MCO) de l'application #link("https://github.com/docker/getting-started-todo-app")[Todo App Cloud]. Réalisé dans le cadre scolaire et amélioré pour la certification RNCP (Bloc 4), ce projet démontre la capacité à monitorer, maintenir et améliorer une architecture microservices en production.

  *Périmètre du MCO :*
  - *Supervision & Dépendances :* Stratégie de mise à jour des packages, sondes Kubernetes et supervision des performances et de la disponibilité.
  - *Gestion des anomalies :* Processus de détection, consignation et résolution des bugs via CI/CD en environnement Cloud (Zero-Downtime).
  - *Support & Amélioration :* Accompagnement des utilisateurs (résolution de tickets) et propositions chiffrées d'amélioration continue (Redis, Serverless).

  #pagebreak()
]

// -------------------------------------------------------------
// TABLE DES MATIÈRES
// -------------------------------------------------------------
#page(header: none)[
  #v(2em)
  #text(size: 18pt, weight: "bold")[Table des Matières]
  #v(1.5em)
  #show outline.entry.where(level: 1): it => {
    v(1.5em, weak: true)
    it
  }
  #outline(title: none, indent: 1.5em, depth: 2)
]


// -------------------------------------------------------------
// SECTIONS INTERNES
// -------------------------------------------------------------

= Supervision et Gestion des Dépendances

#text(style: "italic", fill: rgb("#555555"))[
  Ce chapitre détaille le processus de mise à jour sécurisé des dépendances ainsi que le système de supervision et d'alerte garantissant la haute disponibilité, répondant aux exigences des compétences *C4.1.1* et *C4.1.2*.
]

#v(1em)

#render-clean-md("1_supervision_dependances.md")

#pagebreak()

= Traitement des Anomalies en Production

#text(style: "italic", fill: rgb("#555555"))[
  Ce chapitre illustre la méthode de consignation structurée des bugs et le cycle de déploiement d'un correctif automatisé via CI/CD, répondant aux exigences des compétences *C4.2.1* et *C4.2.2*.
]

#v(1em)

#render-clean-md("2_gestion_anomalies.md")

#pagebreak()

= Collaboration avec le Support Client

#text(style: "italic", fill: rgb("#555555"))[
  Ce chapitre présente une situation de résolution de problème en collaboration avec les équipes de support, démontrant la communication et l'expertise technique, répondant à l'exigence de la compétence *C4.3.3*.
]

#v(1em)

#render-clean-md("3_support_client.md")

#pagebreak()

= Amélioration Continue et Historique

#text(style: "italic", fill: rgb("#555555"))[
  Ce chapitre compile le journal des évolutions du projet ainsi que des recommandations stratégiques (axes d'amélioration chiffrés), répondant aux exigences des compétences *C4.3.1* et *C4.3.2*.
]

#v(1em)

#render-clean-md("4_amelioration_continue.md")


// -------------------------------------------------------------
// PAGE DE FIN (4ème de couverture)
// -------------------------------------------------------------
#pagebreak()
#page(
  header: none,
  footer: move(dy: 8pt)[
    #line(length: 100%, stroke: 0.5pt + rgb("#d0d0d0"))
    #v(-0.3em)
    #grid(
      columns: (1fr, 1fr, 1fr),
      [],
      align(center)[
        #link("https://nicolaswalter.fr")[
          #box(baseline: 20%)[#image("website_logo.svg", height: 0.8em)]
          #h(0.3em)
          #text(size: 9pt, fill: rgb("#777777"))[nicolaswalter.fr]
        ]
      ],
      [],
    )
  ],
)[
  #align(center + horizon)[
    #text(size: 20pt, weight: "bold")[Merci de votre lecture.]
    #v(3em)
    #line(length: 40%, stroke: 0.5pt + rgb("#888888"))
    #v(3em)
    #text(size: 12pt)[
      *Candidat :* Nicolas Walter \
      *Projet :* Todo App Cloud \
      *Certification :* Bloc 4 - RNCP39583
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
