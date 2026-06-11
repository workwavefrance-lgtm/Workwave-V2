#!/usr/bin/env bash
# Scrape SIRENE DOMICILE + PERSONNE — métropole hors Nouvelle-Aquitaine.
# v2 (11/06) : reprise post-interruption (06 et 83 DÉJÀ FAITS, retirés) +
# RETRY 3× avec pause 120 s par dept/vertical — les erreurs réseau d'un
# réveil de Mac faisaient sauter des départements entiers en v1.
# Usage : nohup caffeinate -i bash scraping/scrape_domicile_personne_france.sh \
#           > scraping/scrape_dp_france.log 2>&1 &
set -u
cd "$(dirname "$0")"

DEPTS=(
  13 34 66 30 11 2A 2B                # Méditerranée + Corse (13 partiel à finir)
  74 73 38 05 04 65 09 31             # Alpes + Pyrénées
  44 85 56 29 22 35 50 14 76 62 59    # Atlantique nord + Manche + Nord
  75 92 93 94 77 78 91 95             # Île-de-France
  69 33 67 68 54 57 21 25 39          # grandes métropoles + Est
  01 02 03 07 08 10 12 15 18 26 27 28
  32 36 37 41 42 43 45 46 48 49 51 52
  53 55 58 60 61 63 70 71 72 80 81 82
  84 88 89 90
)

echo "Scrape DOMICILE+PERSONNE v2 (reprise) — $(date)"
for d in "${DEPTS[@]}"; do
  for vert in domicile personne; do
    for attempt in 1 2 3; do
      echo "===== DEPT $d / $vert — tentative $attempt ($(date)) ====="
      if venv/bin/python sirene_par_departement.py --departement "$d" --vertical "$vert" 2>&1; then
        break
      fi
      echo "!! échec dept $d/$vert (tentative $attempt) — pause 120 s"
      sleep 120
    done
  done
done
echo "===== TERMINÉ ($(date)) ====="
