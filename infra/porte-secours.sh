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
# CE QUE FAIT CE SCRIPT : il declare un routeur de priorite 100, donc DEVANT
# celui de Coolify (priorite 38), portant la limite de fabrication simultanee.
# (Il valait 10 dans sa premiere version, en simple secours ; la mesure a montre
# que le probleme n etait pas l absence du routeur mais la saturation du site.)
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

# ATTENTION, PIEGE DEJA TOMBE DEDANS (31/08, 17h11) : il y avait ici une
# verification "le site repond-il en 5 s ?", et le script sortait sans rien
# ecrire quand elle echouait. Or elle echoue precisement quand le site est
# sature, c est-a-dire quand cette regle est le plus necessaire. Resultat : le
# fichier n a pas ete recree, aucune erreur nulle part, et j ai teste pendant
# quinze minutes une regle qui n existait pas. Un garde-fou qui se desarme au
# moment du danger est pire que pas de garde-fou.
# Le conteneur en marche suffit : le routeur de Coolify pointe deja au meme
# endroit, on ne prend donc aucun risque supplementaire.

grep -q "http://$C:3000" "$CIBLE" 2>/dev/null && exit 0  # deja a jour

cat > "$CIBLE" <<YAML
# Genere par /opt/workwave/porte-secours.sh — ne pas modifier a la main.
# Prend le relais quand le routeur Docker du site s absente (voir le script).
http:
  routers:
    # VOIE RESERVEE AUX MOTEURS DE RECHERCHE ET AUX IA.
    # Priorite 200, donc DEVANT la voie limitee. Aucune limite de simultaneite :
    # Google et les IA ne doivent JAMAIS recevoir de refus, c'est la seule source
    # d'acquisition du site. Mesure du 31/08 : Googlebot fait 44 passages par
    # heure et les IA 685, contre 169 821 pour les aspirateurs. Les exempter ne
    # coute donc presque rien, et les refuser couterait le referencement.
    workwave-moteurs:
      entryPoints:
        - https
      rule: (Host(\`workwave.fr\`) || Host(\`www.workwave.fr\`)) && HeaderRegexp(\`User-Agent\`, \`(?i)(googlebot|google-inspectiontool|bingbot|applebot|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-web|anthropic-ai|perplexitybot|duckduckbot|yandexbot|baiduspider)\`)
      priority: 200
      middlewares:
        - workwave-secours-compression
      service: workwave-secours-service
      tls:
        certResolver: letsencrypt
    workwave-secours:
      entryPoints:
        - https
      rule: Host(\`workwave.fr\`) || Host(\`www.workwave.fr\`)
      priority: 100
      middlewares:
        - workwave-limite-simultanee
        - workwave-secours-compression
      service: workwave-secours-service
      tls:
        certResolver: letsencrypt
  middlewares:
    # Nombre maximum de pages fabriquees EN MEME TEMPS.
    # Mesure du 31/08 : une page neuve coute 0,4 a 0,8 s de travail, et les
    # aspirateurs en demandent 42 nouvelles par seconde. Cela represente environ
    # 25 secondes de travail par seconde ecoulee, sur 8 coeurs. Le site accumule
    # les requetes en attente, sa memoire gonfle jusqu a son plafond de 4 096 Mo,
    # puis il cesse de repondre. Constate en direct : moteur a 4 592 Mo, trois
    # appels sans reponse, redemarrage, et rechute en une minute a 801 Mo — la
    # memoire etait la consequence, pas la cause.
    # Au-dela de cette limite, le proxy refuse tout de suite au lieu de laisser
    # le site s etouffer.
    # Reglage : 40 d abord (le site est remonte : processeur de 154 a 78 %,
    # charge de 6,36 a 3,96, memoire stable a 1 636 Mo), mais 40 places etaient
    # toutes prises par les aspirateurs et les visiteurs etaient refuses aussi.
    # Porte a 90, avec les moteurs de recherche exemptes par le routeur
    # ci-dessus. A reajuster en surveillant le processeur du site : s il repasse
    # durablement au-dessus de 150 %, redescendre.
    workwave-limite-simultanee:
      inFlightReq:
        amount: 90
    workwave-secours-compression:
      compress: {}
  services:
    workwave-secours-service:
      loadBalancer:
        servers:
          - url: "http://$C:3000"
YAML
echo "$(date '+%F %T') porte de secours pointee vers $C" >> /opt/workwave/porte-secours.log
