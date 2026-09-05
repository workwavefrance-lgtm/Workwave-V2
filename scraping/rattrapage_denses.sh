#!/usr/bin/env bash
# Rattrapage des departements DENSES, tronques par le plafond de 1 000 du
# scraper Sirene (bug corrige dans le code le 04/08/2026, jamais rejoue).
#
# Mesure du 05/09/2026 : sur 6 metiers x 20 departements denses, 47 791 fiches
# ouvertes chez nous contre 231 951 etablissements ouverts au registre, soit
# 20,6 % de couverture et 184 160 manquants. Consequence dans Google :
# /plombier/montpellier sort en position 35,7 avec 2 895 impressions et 0 clic,
# parce qu'on y montre 61 plombiers quand la ville en compte 323.
#
# Ce script n'ecrit QUE des fiches absentes (upsert ignore_duplicates sur le
# siret) : aucune fiche existante n'est reecrite, donc pas de reordonnancement
# de table (lecon du 03/09).
#
# Usage : cd scraping && nohup caffeinate -i bash rattrapage_denses.sh &
#         (detache : survit a la fermeture du capot et aux interruptions de
#          session, lecon du 31/05)
#
# Reprise : le fichier .rattrapage-faits.txt liste les departements termines.
# Relancer le script les saute.

set -u
cd "$(dirname "$0")"

PY=./venv/bin/python
[ -x "$PY" ] || PY=python3

# Du moins dense au plus dense : les premiers valident la chaine vite, les
# metropoles (75, 13, 69) passent en dernier quand tout est prouve.
DEPTS=(76 67 38 35 95 78 77 94 92 83 06 34 31 44 59 33 69 13 75)

FAITS=.rattrapage-faits.txt
touch "$FAITS"
LOG=rattrapage_denses.log

echo "=== RATTRAPAGE DEPARTEMENTS DENSES ===" | tee -a "$LOG"
echo "debut : $(date)" | tee -a "$LOG"
echo "deja faits : $(wc -l < "$FAITS") departement(s)" | tee -a "$LOG"

for d in "${DEPTS[@]}"; do
  if grep -qx "$d" "$FAITS"; then
    echo "===== DEPT $d : deja fait, saute =====" | tee -a "$LOG"
    continue
  fi
  echo "===== DEPT $d ($(date)) =====" | tee -a "$LOG"

  # 3 tentatives avec pause : au reveil du Mac le wifi met quelques secondes,
  # et sans cette boucle le departement entier etait SAUTE (lecon du 11/06).
  ok=0
  for essai in 1 2 3; do
    # ${PIPESTATUS[0]} et pas le code de sortie du pipe : dans
    # `python ... | tee`, bash renvoie le code de TEE, qui reussit toujours.
    # Sans ca, un python plante passerait pour un succes et le departement
    # serait marque "fait" alors qu'il n'a rien ramene.
    "$PY" sirene_par_departement.py --departement "$d" --vertical btp 2>&1 | tee -a "$LOG"
    if [ "${PIPESTATUS[0]}" -eq 0 ]; then
      ok=1
      break
    fi
    echo "  tentative $essai en echec pour le dept $d, pause 120 s" | tee -a "$LOG"
    sleep 120
  done

  if [ "$ok" = "1" ]; then
    echo "$d" >> "$FAITS"
    echo "----- dept $d termine -----" | tee -a "$LOG"
  else
    echo "!!!!! dept $d EN ECHEC apres 3 tentatives, on continue !!!!!" | tee -a "$LOG"
  fi

  # Respiration entre departements : laisse la base ecrire ses 30 index et
  # evite d'accumuler les depassements de delai (lecon du 03/09).
  sleep 60
done

echo "=== TERMINE : $(date) ===" | tee -a "$LOG"
echo "departements faits : $(wc -l < "$FAITS") / ${#DEPTS[@]}" | tee -a "$LOG"
