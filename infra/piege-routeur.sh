#!/bin/bash
# Capture l etat EXACT de la machine pendant une coupure. 31/08/2026.
#
# Ce qui est deja etabli par la mesure :
#  - le site va bien pendant les coupures (prouve 2 fois : le conteneur renvoie
#    {"ok":true} a la seconde meme ou le proxy ne repond pas) ;
#  - les 1 720 erreurs 503 de l heure de 11h passent TOUTES par le fourre-tout
#    "catchall@file", qui repond sans jamais interroger le site ;
#  - pendant la minute de coupure, 49 % des requetes echouent et 51 % passent,
#    sans AUCUN critere distinctif (meme domaine, protocole, chiffrement, pages) ;
#  - hors coupure rien n est sature : 800 connexions TCP, 2 383 suivis de
#    connexion sur 262 144, 343 descripteurs sur 524 287 ;
#  - le proxy reconstruit sa liste de sites a chaque evenement Docker, et il en
#    passe 236 par minute, dont 142 executions de controles de sante.
#
# Reste a savoir ce qui change PENDANT. D ou les mesures prises a l instant
# precis de l echec, ci-dessous.
JOURNAL=/opt/workwave/routeur-absent.log
INSTANT=/opt/workwave/routeur-absent-details.log
while true; do
  CODE=$(curl -sk -o /dev/null -w "%{http_code}" -m 8 --resolve workwave.fr:443:127.0.0.1 https://workwave.fr/api/health 2>/dev/null)
  # 429 = la limite de fabrication simultanee a refuse, et c est le comportement
  # VOULU depuis 17h16 : mieux vaut un refus immediat qu un site qui s etouffe.
  # Ne doivent alerter que les vraies pannes : pas de reponse (000), erreur du
  # proxy (502/503), ou erreur du site (500).
  # Une coupure pendant un redemarrage preventif est VOULUE (20 s), elle ne doit
  # pas alerter. Le marqueur est pose par garde-memoire.sh et vaut 90 s.
  VOULU=0
  if [ -f /opt/workwave/.redemarrage-en-cours ]; then
    T0=$(cat /opt/workwave/.redemarrage-en-cours 2>/dev/null || echo 0)
    [ $(( $(date +%s) - T0 )) -lt 90 ] && VOULU=1
  fi
  if [ "$CODE" != "200" ] && [ "$CODE" != "429" ] && [ "$VOULU" = "0" ]; then
    T=$(date "+%F %T")
    echo "$T code=$CODE" >> "$JOURNAL"
    P=$(docker inspect coolify-proxy --format '{{.State.Pid}}' 2>/dev/null)
    C=$(docker ps --format '{{.Names}}' 2>/dev/null | grep l13fwu4rw15ksfq7bmy7jx0l | head -1)
    {
      echo "=== $T  code=$CODE ==="
      echo "charge       : $(cut -d' ' -f1-3 /proc/loadavg)"
      echo "connexions   : $(ss -s 2>/dev/null | grep 'TCP:' | head -1)"
      echo "conntrack    : $(cat /proc/sys/net/netfilter/nf_conntrack_count 2>/dev/null) / $(cat /proc/sys/net/netfilter/nf_conntrack_max 2>/dev/null)"
      echo "fd du proxy  : $(ls /proc/$P/fd 2>/dev/null | wc -l)"
      echo "cpu proxy    : $(docker stats --no-stream --format '{{.CPUPerc}} mem={{.MemUsage}}' coolify-proxy 2>/dev/null)"
      echo "cpu site     : $(docker stats --no-stream --format '{{.CPUPerc}} mem={{.MemUsage}}' "$C" 2>/dev/null)"
      echo -n "site direct  : "
      [ -n "$C" ] && timeout 6 docker exec "$C" wget -qO- --timeout=4 http://127.0.0.1:3000/api/health 2>&1 | head -c 60
      echo
      echo -n "proxy vivant : "
      timeout 6 docker exec coolify-proxy sh -c 'echo oui' 2>&1 | head -c 20
      echo
      echo "traefik      : $(docker logs coolify-proxy --tail 3 2>&1 | grep -v DownstreamStatus | tail -2 | tr '\n' ' ' | head -c 200)"
      echo
    } >> "$INSTANT"
  fi
  sleep 8
done
