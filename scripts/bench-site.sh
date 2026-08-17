#!/usr/bin/env bash
# Mesure la vitesse reelle du site (TTFB + temps total) sur un echantillon de
# pages representatives. A lancer AVANT et APRES la migration pour comparer.
#
#   bash scripts/bench-site.sh                  # mesure workwave.fr (prod)
#   bash scripts/bench-site.sh http://IP:3000   # mesure le futur VPS
#
# Chaque URL est appelee RUNS fois ; on garde la MEDIANE (plus fiable qu'une
# moyenne : un seul appel lent ne fausse pas le resultat).

set -uo pipefail
BASE="${1:-https://workwave.fr}"
RUNS="${RUNS:-5}"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

PAGES=(
  "/|Accueil"
  "/plombier/vienne-86|Listing dept"
  "/macon/poitiers|Listing ville"
  "/artisan/marcel-simand-00041|Fiche artisan"
  "/guide-des-prix/prix-pose-carrelage|Guide prix"
  "/deposer-projet|Depot projet"
)

echo ""
echo "  MESURE DE VITESSE — $BASE"
echo "  $(date '+%d/%m/%Y %H:%M')  ·  mediane sur $RUNS appels par page"
echo ""
printf "  %-16s %8s %8s %6s\n" "PAGE" "TTFB" "TOTAL" "CACHE"
printf "  %s\n" "----------------------------------------"

for entry in "${PAGES[@]}"; do
  path="${entry%%|*}"; label="${entry##*|}"
  ttfbs=""; totals=""; code=""; cache=""
  for _ in $(seq 1 "$RUNS"); do
    read -r t1 t2 c < <(curl -s -o /dev/null -A "$UA" \
      -w "%{time_starttransfer} %{time_total} %{http_code}" "$BASE$path" 2>/dev/null)
    ttfbs="$ttfbs $t1"; totals="$totals $t2"; code="$c"
  done
  cache=$(curl -s -o /dev/null -D - -A "$UA" "$BASE$path" 2>/dev/null \
    | grep -i "^x-vercel-cache\|^x-nextjs-cache" | tr -d '\r' | cut -d' ' -f2)
  [ -z "$cache" ] && cache="-"

  read -r med_ttfb med_total < <(python3 -c "
import statistics as s,sys
a=[float(x) for x in '''$ttfbs'''.split()]
b=[float(x) for x in '''$totals'''.split()]
print(f'{s.median(a)*1000:.0f} {s.median(b)*1000:.0f}')")

  printf "  %-16s %5s ms %5s ms %6s\n" "$label" "$med_ttfb" "$med_total" "$cache"
done

echo ""
echo "  TTFB  = temps avant le 1er octet (ce que Google mesure en priorite)"
echo "  TOTAL = temps de reception complet du HTML"
echo "  CACHE = HIT (servi du cache) / MISS (recalcule) / - (pas d'info)"
echo ""
