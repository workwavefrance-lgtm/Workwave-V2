#!/usr/bin/env bash
# Suit l'evolution des Core Web Vitals de workwave.fr apres la migration.
#
#   bash scripts/suivi-web-vitals.sh          # mesure + ajoute une ligne a l'historique
#   bash scripts/suivi-web-vitals.sh --voir   # affiche l'historique
#
# DEUX familles de chiffres, a ne pas confondre :
#   TERRAIN (CrUX) = vrais visiteurs sur 28 JOURS GLISSANTS. Contient encore des
#                    jours d'avant la migration -> s'ameliore lentement.
#   LABO (Lighthouse) = test lance a l'instant sur le serveur actuel. Reagit
#                    immediatement a une optimisation.

set -uo pipefail
HIST="$HOME/Desktop/workwave-web-vitals.csv"
URL="https://workwave.fr/"
API="https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
PARSER="$(mktemp -t wvparse).py"

if [ "${1:-}" = "--voir" ]; then
  if [ ! -f "$HIST" ]; then echo "  Aucun historique. Lance le script sans option."; exit 0; fi
  echo ""
  printf "  %-12s %-9s %6s %10s %8s %9s %8s\n" "DATE" "SUPPORT" "LABO" "LCP(terr)" "CLS" "TTFB" "VERDICT"
  printf "  %s\n" "---------------------------------------------------------------------"
  tail -n +2 "$HIST" | while IFS=, read -r d s p lcp cls ttfb v; do
    printf "  %-12s %-9s %6s %10s %8s %9s %8s\n" "$d" "$s" "$p" "$lcp" "$cls" "$ttfb" "$v"
  done
  echo ""
  exit 0
fi

cat > "$PARSER" <<'PY'
import json, sys
try:
    d = json.load(sys.stdin)
except Exception:
    print("- - - - indisponible"); raise SystemExit

score = d.get("lighthouseResult", {}).get("categories", {}).get("performance", {}).get("score")
perf = str(round(score * 100)) if score is not None else "-"

le = d.get("loadingExperience", {}) or {}
m = le.get("metrics", {}) or {}

def pct(key):
    v = m.get(key, {}).get("percentile")
    return str(v) if v is not None else "-"

lcp = pct("LARGEST_CONTENTFUL_PAINT_MS")
ttfb = pct("EXPERIMENTAL_TIME_TO_FIRST_BYTE")
raw = m.get("CUMULATIVE_LAYOUT_SHIFT_SCORE", {}).get("percentile")
cls = f"{raw/100:.3f}" if raw is not None else "-"

labels = {"FAST": "OK", "AVERAGE": "moyen", "SLOW": "lent"}
cat = le.get("overall_category")
verdict = labels.get(cat, cat if cat else "-")

print(perf, lcp, cls, ttfb, verdict)
PY

[ -f "$HIST" ] || echo "date,support,labo,lcp_terrain_ms,cls_terrain,ttfb_terrain_ms,verdict" > "$HIST"

echo ""
echo "  CORE WEB VITALS — workwave.fr   ($(date '+%d/%m/%Y %H:%M'))"
echo ""

for strat in mobile desktop; do
  curl -s "${API}?url=${URL}&strategy=${strat}&category=performance" --max-time 90 > "${PARSER}.json"
  out=$(python3 "$PARSER" < "${PARSER}.json")
  set -- $out
  perf="${1:--}"; lcp="${2:--}"; cls="${3:--}"; ttfb="${4:--}"; verdict="${5:--}"
  printf "  %-8s labo %3s/100  |  terrain 28j : LCP %6s ms · CLS %6s · TTFB %5s ms  → %s\n" \
    "$strat" "$perf" "$lcp" "$cls" "$ttfb" "$verdict"
  echo "$(date '+%Y-%m-%d'),${strat},${perf},${lcp},${cls},${ttfb},${verdict}" >> "$HIST"
done
rm -f "$PARSER" "${PARSER}.json"

echo ""
echo "  labo    = ton serveur MAINTENANT (reagit tout de suite a une optimisation)"
echo "  terrain = vrais visiteurs sur 28 jours glissants (contient encore l'avant-migration)"
echo "  historique : $HIST"
echo "  revoir    : bash scripts/suivi-web-vitals.sh --voir"
echo ""
