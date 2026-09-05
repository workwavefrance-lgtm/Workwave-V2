#!/usr/bin/env bash
# Rattrapage Sirene, liste de departements passee en arguments.
#
# Generalise rattrapage_denses.sh, dont la liste etait figee dans le fichier :
# le 05/09, le departement 93 y avait ete oublie, et modifier la liste pendant
# qu'un run tourne est dangereux (bash relit le script en cours d'execution).
#
# Usage :
#   cd scraping && nohup caffeinate -i bash rattrapage.sh 93 91 74 30 &
#   cd scraping && nohup caffeinate -i bash rattrapage.sh --vertical domicile 75 13 &
#
# Reprise : chaque departement termine est inscrit dans .rattrapage-faits.txt,
# relancer saute ce qui est fait. Le fichier est partage avec rattrapage_denses.sh.

set -u
cd "$(dirname "$0")"

VERTICAL=btp
if [ "${1:-}" = "--vertical" ]; then
  VERTICAL="$2"
  shift 2
fi

if [ "$#" -eq 0 ]; then
  echo "usage : bash rattrapage.sh [--vertical btp|domicile|personne] DEPT [DEPT...]" >&2
  exit 2
fi

PY=./venv/bin/python
[ -x "$PY" ] || PY=python3

FAITS=".rattrapage-faits-${VERTICAL}.txt"
[ "$VERTICAL" = "btp" ] && FAITS=.rattrapage-faits.txt
touch "$FAITS"
LOG="rattrapage_${VERTICAL}.log"

echo "=== RATTRAPAGE $VERTICAL : $* ===" | tee -a "$LOG"
echo "debut : $(date)" | tee -a "$LOG"

for d in "$@"; do
  if grep -qx "$d" "$FAITS"; then
    echo "===== DEPT $d : deja fait, saute =====" | tee -a "$LOG"
    continue
  fi
  echo "===== DEPT $d ($(date)) =====" | tee -a "$LOG"

  # 3 tentatives avec pause : au reveil du Mac le wifi met quelques secondes,
  # et sans cette boucle le departement entier etait SAUTE (lecon du 11/06).
  ok=0
  for essai in 1 2 3; do
    # -u : sortie non tamponnee, sinon le journal reste muet pendant des heures
    # derriere le pipe. ${PIPESTATUS[0]} : dans `python | tee`, bash renvoie le
    # code de TEE, qui reussit toujours.
    "$PY" -u sirene_par_departement.py --departement "$d" --vertical "$VERTICAL" 2>&1 | tee -a "$LOG"
    if [ "${PIPESTATUS[0]}" -eq 0 ]; then ok=1; break; fi
    echo "  tentative $essai en echec pour le dept $d, pause 120 s" | tee -a "$LOG"
    sleep 120
  done

  if [ "$ok" = "1" ]; then
    echo "$d" >> "$FAITS"
    echo "----- dept $d termine -----" | tee -a "$LOG"
  else
    echo "!!!!! dept $d EN ECHEC apres 3 tentatives, on continue !!!!!" | tee -a "$LOG"
  fi

  # Respiration : laisse la base ecrire ses 30 index (lecon du 03/09).
  sleep 60
done

echo "=== TERMINE $VERTICAL : $(date) ===" | tee -a "$LOG"
