#!/usr/bin/env bash
# Scrape SIRENE des verticaux DOMICILE + PERSONNE pour toute la métropole hors
# Nouvelle-Aquitaine (déjà couverte par le scrape d'origine). Audit du 11/06 :
# ménage/garde d'enfants/soutien scolaire etc. n'existaient QUE dans les 12
# dépts NA → toutes les pages domicile/personne hors NA étaient vides.
#
# Ordre : zones TOURISTIQUES d'abord (Méditerranée, Alpes, Bretagne/Atlantique)
# — priorité business : pages « ménage location saisonnière » pour la saison
# d'été. Puis Île-de-France et grandes métropoles, puis le reste.
#
# DOM (971-976) volontairement exclus ce soir (format postal 5 ch. à valider
# dans query_sirene avant). Corse 2A/2B incluse (fix postal_prefix déjà en place).
#
# Usage : nohup caffeinate -i bash scraping/scrape_domicile_personne_france.sh \
#           > scraping/scrape_dp_france.log 2>&1 &

set -u
cd "$(dirname "$0")"

DEPTS=(
  06 83 13 34 66 30 11 2A 2B          # Méditerranée + Corse (saison été)
  74 73 38 05 04 65 09 31             # Alpes + Pyrénées
  44 85 56 29 22 35 50 14 76 62 59    # Atlantique nord + Manche + Nord
  75 92 93 94 77 78 91 95             # Île-de-France
  69 13 33 67 68 54 57 21 25 39       # grandes métropoles + Est
  01 02 03 07 08 10 12 15 18 26 27 28 # reste de la métropole
  32 36 37 41 42 43 45 46 48 49 51 52
  53 55 58 60 61 63 70 71 72 80 81 82
  84 88 89 90
)

LOG_PREFIX="scrape_dp"
echo "Scrape DOMICILE+PERSONNE national — $(date)"

for d in "${DEPTS[@]}"; do
  for vert in domicile personne; do
    echo "===== DEPT $d / $vert ($(date)) ====="
    venv/bin/python sirene_par_departement.py --departement "$d" --vertical "$vert" 2>&1
  done
done

echo "===== TERMINÉ ($(date)) ====="
