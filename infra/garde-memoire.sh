#!/bin/bash
# Empeche l etouffement du moteur du site. Ecrit le 31/08/2026, apres une panne
# constatee en direct.
#
# CE QUI S EST PASSE (mesure, pas suppose) :
#   NODE_OPTIONS=--max-old-space-size=4096  -> le moteur est bride a 4 096 Mo.
#   Mesure a 17h05 : le processus next-server occupait 4 592 Mo, soit AU-DESSUS
#   de son plafond. A ce stade il passe tout son temps a recuperer de la memoire
#   et ne repond plus a personne : trois appels de suite sans reponse, code 000.
#   Le conteneur restait "healthy", le proxy allait bien (38 % de processeur,
#   180 Mo), et le fourre-tout de Coolify repondait a la place du site.
#   Apres redemarrage : reponse en 0,15 s, moteur a 552 Mo.
#
# VITESSE DE MONTEE MESUREE : 4 592 Mo atteints en 16 h de fonctionnement, soit
# environ 285 Mo par heure. A ce rythme, l etouffement revient toutes les ~14 h.
#
# CE QUE FAIT CE SCRIPT : il redemarre le site AVANT l etouffement, a 3 500 Mo.
# Quarante secondes de coupure choisie valent mieux que vingt minutes subies.
# Ce n est PAS le correctif de fond : il faut relever le plafond du moteur
# (NODE_OPTIONS) et chercher pourquoi la memoire monte si vite. Ce script est le
# filet en attendant, et il restera utile ensuite.
SEUIL_MO=3500
JOURNAL=/opt/workwave/garde-memoire.log
COURBE=/opt/workwave/courbe-moteur.csv

RSS=$(ps -eo rss,comm --sort=-rss 2>/dev/null | awk '$2=="next-server"{print int($1/1024); exit}')
[ -z "$RSS" ] && exit 0

echo "$(date '+%F %T'),$RSS" >> "$COURBE"
tail -2000 "$COURBE" > "$COURBE.tmp" 2>/dev/null && mv "$COURBE.tmp" "$COURBE"

[ "$RSS" -lt "$SEUIL_MO" ] 2>/dev/null && exit 0

C=$(docker ps --format '{{.Names}}' 2>/dev/null | grep '^l13fwu4rw15ksfq7bmy7jx0l' | head -1)
[ -z "$C" ] && exit 0

echo "$(date '+%F %T') moteur a $RSS Mo (seuil $SEUIL_MO) : redemarrage preventif" >> "$JOURNAL"
# Marqueur lu par le piege, pour qu il n alerte pas sur une coupure VOULUE.
# Sans lui, chaque redemarrage preventif (toutes les 12 min au rythme actuel)
# produit une alerte identique a une vraie panne. Une alerte qui se declenche
# sans arret ne vaut pas mieux qu une alerte absente : la prochaine vraie sera
# ignoree. Le marqueur expire seul au bout de 90 s.
date +%s > /opt/workwave/.redemarrage-en-cours
docker logs "$C" --tail 30 > "/opt/workwave/crashs/avant-redemarrage-$(date +%Y%m%d-%H%M%S).log" 2>&1
docker restart "$C" >/dev/null 2>&1
sleep 20
CODE=$(curl -sk -o /dev/null -w '%{http_code}' -m 25 --resolve workwave.fr:443:127.0.0.1 https://workwave.fr/api/health 2>/dev/null)
echo "$(date '+%F %T')   apres redemarrage : $CODE" >> "$JOURNAL"
