#!/bin/bash
# Rendu d'un reel AVEC verification, pour qu'une video tronquee ne passe plus.
#
# Le 17/08, deux reels sont sortis a 5,9 s au lieu de 14 s : ffmpeg s'arrete a
# la premiere image manquante, en silence. On verifie donc que la suite
# d'images est complete AVANT d'encoder, et que la duree finale correspond
# APRES. Sans ca, on livre une video coupee sans le savoir.
#
# Usage : bash scripts/rendre-reel.sh projet|bienvenue <chemin-du-json>
set -u
TYPE="$1"; JSON="$2"
cd "$(dirname "$0")/.."

# Les images sont ecrites hors de ~/Desktop : ce dossier est synchronise par
# iCloud, qui recree des copies "f00419 2.png" pendant que le script vide le
# dossier. C'est ce qui faisait echouer le nettoyage (ENOTEMPTY) et sortir des
# videos tronquees en silence. Mesure du 20/08 : 644 fichiers pour 420 images.
case "$TYPE" in
  projet)    SCRIPT=scripts/render-reel-projet.mjs;      DIR="${TMPDIR:-/tmp}/workwave-frames-projet";      PREFIXE=Workwave-projet ;;
  bienvenue) SCRIPT=scripts/render-reel-nouveau-pro.mjs; DIR="${TMPDIR:-/tmp}/workwave-frames-nouveau-pro"; PREFIXE=Workwave-nouveau-pro ;;
  *) echo "type inconnu : $TYPE"; exit 1 ;;
esac

SLUG=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['slug'])" "$JSON")
SORTIE="marketing/${PREFIXE}-${SLUG}.mp4"

if ! curl -sf -o /dev/null http://localhost:8877/ ; then
  echo "ECHEC $SLUG : le serveur local du port 8877 ne repond pas"; exit 1
fi

ATTENDU=$(node "$SCRIPT" "$JSON" 2>&1 | tee /tmp/reel-$SLUG.log | grep -oE "OK · [0-9]+ frames" | grep -oE "[0-9]+")
if [ -z "${ATTENDU:-}" ]; then
  echo "ECHEC $SLUG : le rendu n'a pas abouti"; tail -3 /tmp/reel-$SLUG.log; exit 1
fi

# On ne compte que les noms au format EXACT : une copie iCloud s'appelle
# "f00419 2.png" et ne doit ni etre comptee ni faire echouer le controle.
REEL=$(ls "$DIR" 2>/dev/null | grep -cE '^f[0-9]{5}\.png$')
if [ "$REEL" != "$ATTENDU" ]; then
  echo "ECHEC $SLUG : $REEL images valides sur le disque pour $ATTENDU attendues"; exit 1
fi
# La suite doit etre CONTIGUE : ffmpeg s'arrete au premier trou et sort une
# video plus courte, sans la moindre erreur.
MANQUANTE=""
for i in $(seq 0 $((ATTENDU - 1))); do
  F=$(printf "f%05d.png" "$i")
  [ -f "$DIR/$F" ] || { MANQUANTE="$F"; break; }
done
[ -z "$MANQUANTE" ] || { echo "ECHEC $SLUG : image $MANQUANTE absente, la suite a un trou"; exit 1; }
# Et rien APRES la derniere : ffmpeg encoderait les images d'un rendu precedent.
SUIVANTE=$(printf "f%05d.png" "$ATTENDU")
[ ! -f "$DIR/$SUIVANTE" ] || { echo "ECHEC $SLUG : $SUIVANTE existe, restes d'un rendu precedent"; exit 1; }

rm -f "$SORTIE"
ffmpeg -y -framerate 30 -i "$DIR/f%05d.png" -c:v libx264 -pix_fmt yuv420p \
       -movflags +faststart "$SORTIE" >/dev/null 2>&1

DUREE=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SORTIE" 2>/dev/null | cut -d. -f1)
VOULUE=$((ATTENDU / 30))
ECART=$((DUREE - VOULUE)); [ $ECART -lt 0 ] && ECART=$((-ECART))
if [ "$ECART" -gt 1 ]; then
  echo "ECHEC $SLUG : video de ${DUREE}s au lieu de ${VOULUE}s (TRONQUEE)"; exit 1
fi

cp "$SORTIE" ~/Desktop/
echo "OK $SLUG : ${DUREE}s, $ATTENDU images, $(du -h "$SORTIE" | cut -f1) -> Bureau"
