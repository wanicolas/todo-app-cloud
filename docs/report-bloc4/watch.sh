#!/bin/bash
# Raccourci pour compiler le rapport Typst en continu (Live-Reload) via Docker.

echo "👀 Typst Watch lancé : modification des fichiers en cours d'écoute..."
echo "Ouvrez le fichier report.pdf dans VS Code ou un lecteur PDF externe pour voir les changements en direct."
echo "(Faites Ctrl+C pour arrêter)"

docker run -it --rm \
  -v "$(pwd)/..:/data" \
  -w /data/report-bloc4 \
  ghcr.io/typst/typst:latest \
  watch report_bloc4.typ --root /data --font-path ./fonts
