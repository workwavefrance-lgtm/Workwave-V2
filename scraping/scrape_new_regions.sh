#!/usr/bin/env bash
# Scrape SIRENE BTP des 28 nouveaux départements (Bretagne, Pays de la Loire,
# Occitanie, PACA). Réutilise sirene_par_departement.py (dept-agnostic).
#
# ⚠️ PRÉREQUIS : facture Supabase à jour (pas de "pending shutdown") — ingest
# de plusieurs centaines de milliers de lignes. Job de PLUSIEURS JOURS
# (SIRENE rate-limité 2s/req). Lancer dans un screen/tmux ou en nohup.
#
# Ordre : petits départements d'abord (validation rapide + premiers wins SEO),
# grosses métropoles (Toulouse 31, Marseille 13, Nice 06, Nantes 44, Montpellier
# 34, Rennes 35) en dernier.
#
# Usage : cd scraping && bash scrape_new_regions.sh
#         (ou pour reprendre à un dépt : éditer la liste DEPTS ci-dessous)

set -u
cd "$(dirname "$0")"

DEPTS=(
  48 05 04 09 32 65 46 12 82 53        # petits
  11 30 81 66 85 72 49 22 56 29 84 83  # moyens
  35 34 44 06 13 31                    # grosses métropoles (en dernier)
)

LOG="scrape_new_regions_$(date +%Y%m%d_%H%M%S 2>/dev/null || echo run).log"
echo "Scrape BTP 28 dépts -> $LOG"

for d in "${DEPTS[@]}"; do
  echo "===== DEPT $d ($(date)) ====="
  venv/bin/python sirene_par_departement.py --departement "$d" --vertical btp 2>&1 | tee -a "$LOG"
  echo "----- fin dept $d -----"
done

echo "TERMINÉ : 28 départements scrappés. Voir $LOG."
