#!/usr/bin/env bash
# Scrape SIRENE BTP des 59 NOUVEAUX départements (métropole restante + DOM).
# Réutilise sirene_par_departement.py (dept-agnostic, pipeline PROUVÉ sur 28 dépts).
#
# ⚠️ Job de PLUSIEURS JOURS (SIRENE rate-limité ~2s/req, Île-de-France = énorme).
# Lancer détaché : nohup caffeinate -i bash scrape_all_france.sh &
#
# Ordre : PETITS départements d'abord (validation rapide du pipeline sur les
# nouvelles régions + premiers wins SEO), Île-de-France (Paris) et grosses
# métropoles (Lyon 69, Lille 59) EN DERNIER.
#
# Reprise : éditer la liste DEPTS (retirer ceux déjà faits) et relancer.
# Idempotent côté pros (upsert sur siret).

set -u
cd "$(dirname "$0")"

DEPTS=(
  # --- Très petits (validation pipeline) ---
  90 15 55 52 70 58 36 43 39 08
  # --- Petits / moyens ---
  88 03 18 89 10 07 28 41 61 50 02 21 71 25 37 27 73 51
  # --- DOM (codes 3 chiffres) ---
  971 972 973 974 976
  # --- Moyens / gros ---
  01 26 45 42 80 54 63 14 74 68 60 57 67 76 38 62
  # --- Grosses métropoles EN DERNIER ---
  69 59
  # --- Île-de-France (Paris = le plus gros, tout à la fin) ---
  91 77 78 95 94 93 92 75
)

LOG="scrape_all_france_$(date +%Y%m%d_%H%M%S 2>/dev/null || echo run).log"
echo "Scrape BTP ${#DEPTS[@]} dépts -> $LOG"
echo "Début : $(date)" | tee -a "$LOG"

for d in "${DEPTS[@]}"; do
  echo "===== DEPT $d ($(date)) =====" | tee -a "$LOG"
  venv/bin/python sirene_par_departement.py --departement "$d" --vertical btp 2>&1 | tee -a "$LOG"
  echo "----- fin dept $d -----" | tee -a "$LOG"
done

echo "TERMINÉ : ${#DEPTS[@]} départements scrappés ($(date)). Voir $LOG." | tee -a "$LOG"
