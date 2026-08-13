#!/bin/bash
# =============================================================================
# UN SEUL CONTENEUR APPLICATIF A LA FOIS
# =============================================================================
# POURQUOI CE SCRIPT EXISTE (13/08/2026, constate DEUX fois le meme jour)
#
# Coolify construit l'image, demarre le nouveau conteneur, valide son
# healthcheck... puis echoue a supprimer l'ancien. Les DEUX restent actifs,
# tous deux avec le label `traefik.enable=true`. Traefik repartit alors le
# trafic entre eux : le site sert l'ANCIENNE ou la NOUVELLE version selon le
# visiteur, au hasard.
#
# Mesure du 13/08 : sur 3 requetes vers workwave.fr apres un deploiement
# "reussi", 1 tombait sur l'ancien conteneur et 2 sur le nouveau. Invisible
# depuis l'interface Coolify, invisible sur un seul curl.
#
# CE QUE FAIT LE SCRIPT
# Il garde le conteneur applicatif le PLUS RECEMMENT CREE et arrete les autres.
#
# GARDE-FOUS
#  - il ne touche QU'AUX conteneurs de cette application (prefixe UUID) ;
#  - il ne fait qu'un `docker stop`, JAMAIS de `rm` : l'ancien reste
#    inspectable et relancable en une commande, et son image est intacte ;
#  - il n'agit que s'il y a STRICTEMENT plus d'un conteneur actif ;
#  - il refuse d'agir si le plus recent n'est pas "healthy" : mieux vaut deux
#    versions servies qu'aucune.
#
# Installation : cron toutes les 5 minutes sur le VPS.
# =============================================================================

set -u
UUID="l13fwu4rw15ksfq7bmy7jx0l"
JOURNAL="/var/log/workwave-un-seul-conteneur.log"

trace() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >> "$JOURNAL"; }

# Conteneurs ACTIFS de l'application, tries du plus recent au plus ancien.
mapfile -t ACTIFS < <(docker ps --filter "name=${UUID}" --format '{{.CreatedAt}}|{{.Names}}' \
                      | sort -r | cut -d'|' -f2)

NB=${#ACTIFS[@]}
[ "$NB" -le 1 ] && exit 0   # cas nominal : rien a faire, on ne journalise pas

RECENT="${ACTIFS[0]}"

# Le plus recent doit etre sain avant qu'on coupe les autres.
SANTE=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}sans-healthcheck{{end}}' "$RECENT" 2>/dev/null)
if [ "$SANTE" != "healthy" ] && [ "$SANTE" != "sans-healthcheck" ]; then
  trace "ALERTE : $NB conteneurs actifs mais le plus recent ($RECENT) est '$SANTE'. On ne touche a rien."
  exit 1
fi

trace "$NB conteneurs actifs. On garde $RECENT (etat: $SANTE)."
for C in "${ACTIFS[@]:1}"; do
  docker stop "$C" >/dev/null 2>&1 && trace "  arrete : $C" || trace "  ECHEC arret : $C"
done

# Verification finale EN REEL : le site doit repondre.
#
# TROIS TENTATIVES, PAS UNE. Au premier essai le 13/08, le controle a renvoye
# 000 (echec total) alors que le site allait parfaitement : Traefik venait de
# perdre une cible et n'avait pas encore reconverge. Une alerte declenchee sur
# un seul essai, deux secondes apres un arret de conteneur, est un faux positif
# garanti -- et une alerte qui crie pour rien est une alerte qu'on finit par
# ignorer.
sleep 5
CODE=""
for _ in 1 2 3; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -m 20 https://workwave.fr/ 2>/dev/null)
  [ "$CODE" = "200" ] && break
  sleep 8
done
trace "  workwave.fr repond $CODE"
[ "$CODE" = "200" ] || trace "  ALERTE : le site ne repond pas 200 apres 3 essais"
