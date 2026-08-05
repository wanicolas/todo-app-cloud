#!/bin/bash
# Raccourci pour compiler le rapport Typst via Docker sans polluer le système hôte.

echo "⏳ Compilation du rapport Typst en cours..."

docker run --rm \
  -v "$(pwd)/..:/data" \
  -w /data/report-bloc4 \
  ghcr.io/typst/typst:latest \
  compile report_bloc4.typ --root /data --font-path ./fonts

if [ $? -eq 0 ]; then
  echo "✅ Compilation terminée avec succès : report_bloc4.pdf a été généré."
else
  echo "❌ Erreur lors de la compilation."
fi
