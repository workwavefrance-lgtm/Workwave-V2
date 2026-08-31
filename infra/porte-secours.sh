#!/bin/bash
# Porte de secours du routage — a deposer dans /opt/workwave/ sur le VPS.
#
# POURQUOI (mesure du 31/08/2026, heure de 11h UTC, journal du proxy) :
#   143 645 pages servies  -> routeur "https-0-<uuid>@docker"  (celui du site)
#     1 720 erreurs 503    -> routeur "catchall@file"          (le fourre-tout)
# Le fourre-tout est genere par Coolify (priorite -1000, service VIDE) : il
# repond "indisponible" sans jamais interroger le site. Or le site fonctionne
# pendant ces erreurs : 0,04 s de reponse, memoire stable a 4,5 Go, charge 1,89
# sur 8 coeurs, controle de sante Docker sans un seul echec en 24 h.
# Conclusion : le routeur du site s absente de la configuration du proxy, par
# fenetres d environ une minute, plusieurs fois par heure. Ni Traefik ni Docker
# ne journalisent l evenement.
#
# CE QUE FAIT CE SCRIPT : il declare un SECOND routeur, de priorite 10.
#   - Le routeur Docker a une priorite de 38 (Traefik la calcule sur la longueur
#     de sa regle : "Host(`workwave.fr`) && PathPrefix(`/`)").
#   - Le fourre-tout a une priorite de -1000.
#   - 10 se place entre les deux : ce routeur ne sert JAMAIS tant que celui du
#     site est present, et prend le relais uniquement pendant ses absences.
# Pendant une absence, le visiteur recoit donc la page au lieu d une erreur.
#
# POURQUOI IL SE REECRIT : le nom du conteneur porte un horodatage
# (l13fwu4rw15ksfq7bmy7jx0l-180220402022) et change a CHAQUE deploiement. Ecrit
# en dur, il pointerait vers le vide au deploiement suivant. Le script est donc
# rappele par le cron ; il ne reecrit le fichier que si le nom a change, pour ne
# pas faire recharger Traefik inutilement.
#
# PIEGE RENCONTRE A LA POSE : referencer "gzip" ici echoue. Ce middleware est
# declare par Coolify du cote Docker, donc sous le nom "gzip@docker" ; un
# routeur declare dans un fichier ne voit que les middlewares "@file". Traefik
# rejette alors le routeur en entier ("middleware gzip@file does not exist") et
# la porte de secours ne sert plus a rien, en silence. On declare donc notre
# propre compression ci-dessous.
#
# POUR ANNULER : supprimer le fichier cible et la ligne de cron. Traefik
# recharge tout seul (watch=true sur le repertoire), sans redemarrage ni coupure.
CIBLE=/data/coolify/proxy/dynamic/zz-workwave-secours.yaml
PREFIXE=l13fwu4rw15ksfq7bmy7jx0l

C=$(docker ps --format '{{.Names}}' 2>/dev/null | grep "^${PREFIXE}" | head -1)
[ -z "$C" ] && exit 0                                    # conteneur absent : ne rien toucher

# On ne declare la porte de secours QUE si elle mene vraiment quelque part.
docker exec coolify-proxy wget -qO- --timeout=5 "http://$C:3000/api/health" >/dev/null 2>&1 || exit 0

grep -q "http://$C:3000" "$CIBLE" 2>/dev/null && exit 0  # deja a jour

cat > "$CIBLE" <<YAML
# Genere par /opt/workwave/porte-secours.sh — ne pas modifier a la main.
# Prend le relais quand le routeur Docker du site s absente (voir le script).
http:
  routers:
    workwave-secours:
      entryPoints:
        - https
      rule: Host(\`workwave.fr\`) || Host(\`www.workwave.fr\`)
      priority: 10
      middlewares:
        - workwave-secours-compression
      service: workwave-secours-service
      tls:
        certResolver: letsencrypt
  middlewares:
    workwave-secours-compression:
      compress: {}
  services:
    workwave-secours-service:
      loadBalancer:
        servers:
          - url: "http://$C:3000"
YAML
echo "$(date '+%F %T') porte de secours pointee vers $C" >> /opt/workwave/porte-secours.log
