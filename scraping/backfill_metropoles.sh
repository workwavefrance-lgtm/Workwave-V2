#!/usr/bin/env bash
# Backfill founded_year (ancienneté) des grosses métropoles, SÉQUENTIEL pour
# respecter le rate-limit de recherche-entreprises.api.gouv.fr (~7 req/s).
# Attend d'abord la fin du backfill Vienne (PID en arg 1) pour ne pas cumuler.
set -u
cd "$(dirname "$0")/.."
LOG="scraping/backfill_metropoles.log"

VIENNE_PID="${1:-}"
if [ -n "$VIENNE_PID" ]; then
  echo "Attente fin backfill Vienne (PID $VIENNE_PID)…" | tee -a "$LOG"
  while kill -0 "$VIENNE_PID" 2>/dev/null; do sleep 60; done
  echo "Vienne terminé, démarrage métropoles." | tee -a "$LOG"
fi

# Dépts des grosses métropoles DÉJÀ scrapées (vague 1).
# Bordeaux(33) Toulouse(31) Marseille(13) Nice(06) Nantes(44) Montpellier(34)
for d in 33 31 13 06 44 34; do
  echo "===== DEPT $d ($(date)) =====" | tee -a "$LOG"
  npx tsx scripts/backfill-founded-year.ts --dept "$d" --apply 2>&1 \
    | grep -vE "Warning|warn|urllib|injected|tip:|dotenvx" | tee -a "$LOG"
done
echo "TERMINÉ métropoles ($(date))" | tee -a "$LOG"
