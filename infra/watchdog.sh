#!/usr/bin/env bash
# Gardien Workwave v2.
# Corrige les deux failles qui ont laisse le site mort plusieurs heures le 04/08/2026 :
#  1. l'ancien utilisait `docker ps` (conteneurs EN MARCHE seulement) : un conteneur
#     arrete etait donc invisible, et le script sortait sans rien faire ni alerter.
#  2. il lisait la cle d'envoi DANS le conteneur : impossible quand il est mort.
#     On la met desormais en cache sur le disque des que tout va bien.
LOG=/var/log/workwave-watchdog.log
ETAT=/opt/workwave/.watchdog-etat
ECHECS=/opt/workwave/.watchdog-echecs
# Journal des echecs horodates, pour compter sur une fenetre glissante. Le
# 30/08/2026 le site alternait entre 200 et 503 : le compteur d'echecs
# CONSECUTIFS retombait a zero a chaque passage reussi et le gardien n'a jamais
# relance. Une panne intermittente est une panne.
HISTO=/opt/workwave/.watchdog-histo
COURBE=/opt/workwave/courbe-conteneur.csv
FENETRE_MIN=30
SEUIL_FENETRE=3
SEUIL_MEMOIRE_MO=6144
CREDS=/opt/workwave/.alert-creds
SEUIL=2
log(){ echo "$(date '+%F %T') $*" >> "$LOG"; }

alerte(){
  [ -f "$CREDS" ] || { log "alerte impossible : pas d'identifiants en cache"; return; }
  . "$CREDS"
  [ -n "$RESEND_API_KEY" ] && [ -n "$ADMIN_EMAIL" ] || { log "identifiants incomplets"; return; }
  curl -s -o /dev/null -X POST https://api.resend.com/emails \
    -H "Authorization: Bearer $RESEND_API_KEY" -H "Content-Type: application/json" \
    -d "$(python3 -c "import json,sys;print(json.dumps({'from':'Workwave <contact@workwave.fr>','to':[sys.argv[1]],'subject':sys.argv[2],'text':sys.argv[3]}))" "$ADMIN_EMAIL" "$1" "$2")"
  log "alerte envoyee : $1"
}

# On teste comme un visiteur, depuis l'exterieur du conteneur.
CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 https://workwave.fr/)

# Cf. l'en-tete de /opt/workwave/garde-memoire.sh : un redemarrage preventif
# coupe une vingtaine de secondes, volontairement. Ce n'est pas une panne.
if [ -f /opt/workwave/.redemarrage-en-cours ]; then
  T0=$(cat /opt/workwave/.redemarrage-en-cours 2>/dev/null || echo 0)
  if [ $(( $(date +%s) - T0 )) -lt 120 ]; then
    log "echec ignore : redemarrage preventif en cours (code=$CODE)"
    exit 0
  fi
fi

# 429 = le proxy a refuse pour proteger le site (file des aspirateurs pleine).
# C'est voulu, ce n'est pas une indisponibilite.
if [ "$CODE" = "200" ] || [ "$CODE" = "429" ]; then
  # Tout va bien : on en profite pour rafraichir les identifiants d'alerte.
  C=$(docker ps --format '{{.Names}}' | grep -v '^coolify' | head -1)
  if [ -n "$C" ]; then
    K=$(docker exec "$C" printenv RESEND_API_KEY 2>/dev/null)
    M=$(docker exec "$C" printenv ADMIN_EMAIL 2>/dev/null)
    [ -n "$K" ] && [ -n "$M" ] && printf 'RESEND_API_KEY=%s\nADMIN_EMAIL=%s\n' "$K" "$M" > "$CREDS" && chmod 600 "$CREDS"
    docker update --restart=unless-stopped "$C" >/dev/null 2>&1
    # Plafond memoire (28/08/2026) : sans lui, une fuite peut avaler les 31 Go
    # et faire tuer la machine par le noyau, comme le 07/08. 16 Go = 12x ce que
    # l app consomme reellement (1,28 Go). Un deploiement Coolify recree le
    # conteneur et efface ce reglage : on le repose donc a chaque passage.
    [ "$(docker inspect "$C" --format '{{.HostConfig.Memory}}' 2>/dev/null)" = "0" ] && \
      docker update --memory 16g --memory-swap 20g "$C" >/dev/null 2>&1
  fi
  [ "$(cat "$ETAT" 2>/dev/null)" = "down" ] && { alerte "[Workwave] Site RETABLI" "Le site repond de nouveau (HTTP 200). $(date '+%d/%m/%Y %H:%M')"; log "RETABLI"; }
  echo ok > "$ETAT"; echo 0 > "$ECHECS"
  # Memoire du CONTENEUR (et non de containerd) : c'est elle qui est passee de
  # 700 Mo a 16 Go en 34 h le 30/08/2026, sans que rien ne l'enregistre. On la
  # note a chaque passage, et on redemarre avant la saturation : 40 s de
  # coupure choisie valent mieux qu'une heure subie.
  if [ -n "$C" ]; then
    # `docker stats` additionne la memoire allouee ET le cache de fichiers.
    # Le 31/08/2026, sur 7 992 Mo affiches, 7 034 etaient du cache -- recuperable
    # et parfaitement normal avec 2,4 millions de pages en cache. Se fier a ce
    # chiffre faisait redemarrer une application qui allait bien, et chaque
    # redemarrage relance la reconstruction du cache : le garde-fou nourrissait
    # le probleme qu'il devait empecher.
    # `anon` du cgroup est la memoire vraiment allouee. C'est elle qu'on surveille.
    ID=$(docker inspect "$C" --format '{{.Id}}' 2>/dev/null)
    STAT=""
    for f in "/sys/fs/cgroup/system.slice/docker-$ID.scope/memory.stat" "/sys/fs/cgroup/docker/$ID/memory.stat"; do
      [ -f "$f" ] && { STAT="$f"; break; }
    done
    if [ -n "$STAT" ]; then
      MO=$(awk '/^anon /{printf "%.0f", $2/1048576}' "$STAT")
    else
      MO=""
    fi
    if [ -n "$MO" ]; then
      echo "$(date '+%F %T'),$MO" >> "$COURBE"
      tail -600 "$COURBE" > "$COURBE.tmp" 2>/dev/null && mv "$COURBE.tmp" "$COURBE"
      if [ "$MO" -gt "$SEUIL_MEMOIRE_MO" ] 2>/dev/null; then
        log "conteneur a $MO Mo (seuil $SEUIL_MEMOIRE_MO) : redemarrage preventif"
        docker restart "$C" >/dev/null 2>&1
        alerte "[Workwave] Redemarrage preventif de la memoire" "L application avait atteint $MO Mo de memoire reellement allouee (seuil $SEUIL_MEMOIRE_MO), sans avoir encore coupe le site. Il a ete redemarre avant la saturation.

Courbe des mesures : $COURBE

$(date '+%d/%m/%Y %H:%M')"
      fi
    fi
  fi
  exit 0
fi

N=$(cat "$ECHECS" 2>/dev/null || echo 0); N=$((N+1)); echo "$N" > "$ECHECS"
date +%s >> "$HISTO"
LIMITE=$(( $(date +%s) - FENETRE_MIN * 60 ))
awk -v l="$LIMITE" '$1 >= l' "$HISTO" > "$HISTO.tmp" 2>/dev/null && mv "$HISTO.tmp" "$HISTO"
DANS_FENETRE=$(wc -l < "$HISTO" 2>/dev/null || echo 0)
log "ECHEC $N/$SEUIL (code=${CODE:-aucun}) · $DANS_FENETRE echec(s) sur $FENETRE_MIN min"
# Deux chemins vers l'action : deux echecs de suite (panne franche), ou assez
# d'echecs sur la fenetre (panne intermittente, invisible autrement).
if [ "$N" -lt "$SEUIL" ] && [ "$DANS_FENETRE" -lt "$SEUIL_FENETRE" ]; then exit 0; fi
if [ "$DANS_FENETRE" -ge "$SEUIL_FENETRE" ]; then
  log "panne intermittente : $DANS_FENETRE echecs sur $FENETRE_MIN min"
fi
: > "$HISTO"

# -a : on voit AUSSI les conteneurs arretes. C'est toute la difference.
C=$(docker ps -a --format '{{.Names}}' | grep -v '^coolify' | head -1)
if [ -n "$C" ]; then
  log "capture : $(/opt/workwave/capture-crash.sh "$C")"
  log "relance de $C"
  docker update --restart=unless-stopped "$C" >/dev/null 2>&1
  docker start "$C" >/dev/null 2>&1 || docker restart "$C" >/dev/null 2>&1
  sleep 60
  CODE2=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 https://workwave.fr/)
else
  log "aucun conteneur applicatif, meme arrete"
  CODE2=""
fi

if [ "$CODE2" = "200" ]; then
  [ "$(cat "$ETAT" 2>/dev/null)" != "down" ] && alerte "[Workwave] Site relance automatiquement" "Le site ne repondait plus (code ${CODE:-aucun}). Le gardien l'a redemarre : il repond de nouveau. $(date '+%d/%m/%Y %H:%M')"
  echo ok > "$ETAT"; echo 0 > "$ECHECS"
else
  [ "$(cat "$ETAT" 2>/dev/null)" != "down" ] && alerte "[Workwave] SITE HORS LIGNE - action requise" "Le site ne repond plus et le redemarrage n'a pas suffi (code ${CODE2:-aucun}). Ouvrir Coolify : http://72.60.130.5:8000  $(date '+%d/%m/%Y %H:%M')"
  echo down > "$ETAT"
fi
