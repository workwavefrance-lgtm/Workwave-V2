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

# Pendant un deploiement, DEUX conteneurs tournent quelques minutes (Coolify
# demarre le nouveau avant d arreter l ancien). `head -1` prenait celui que
# docker listait en premier, sans garantie : le routage pouvait pointer vers la
# version qu on est en train de remplacer. On prend donc explicitement le PLUS
# RECEMMENT CREE, comme le fait deja un-seul-conteneur.sh.
C=$(docker ps --format '{{.CreatedAt}}|{{.Names}}' 2>/dev/null | grep "|${PREFIXE}" | sort -r | head -1 | cut -d'|' -f2)
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
    # FICHIERS STATIQUES (styles, polices, images, scripts). Priorite 250, aucune
    # limite : les servir ne coute presque rien, et les refuser afficherait des
    # pages cassees chez les visiteurs. C est aussi ce qui distingue un vrai
    # navigateur d un aspirateur : mesure du 31/08, les vrais visiteurs chargent
    # 40 % de ressources, les aspirateurs 0 %.
    workwave-statique:
      entryPoints:
        - https
      rule: (Host(\`workwave.fr\`) || Host(\`www.workwave.fr\`)) && (PathPrefix(\`/_next/static\`) || PathPrefix(\`/_next/image\`) || Path(\`/favicon.ico\`) || Path(\`/robots.txt\`) || PathPrefix(\`/sitemap\`))
      priority: 250
      middlewares:
        - workwave-secours-compression
      service: workwave-secours-service
      tls:
        certResolver: letsencrypt
    # VISITEURS SUR TELEPHONE ET TABLETTE. Priorite 150, avec leur PROPRE file
    # d attente de 30 places, separee de celle des aspirateurs.
    # Pourquoi : mesure du 31/08 apres la pose de la limite unique, 40 % des
    # visiteurs mobiles etaient refuses parce que les aspirateurs occupaient
    # toutes les places. Une file commune donne la priorite au plus bruyant.
    # Les aspirateurs se declarent Chrome sur Windows ou Mac (98 % du volume),
    # jamais mobile : cette file leur est de fait inaccessible.
    workwave-mobile:
      entryPoints:
        - https
      rule: (Host(\`workwave.fr\`) || Host(\`www.workwave.fr\`)) && HeaderRegexp(\`User-Agent\`, \`(iPhone|iPad|Android|Mobile Safari)\`)
      priority: 150
      middlewares:
        - workwave-secours-compression
      service: workwave-secours-service
      tls:
        certResolver: letsencrypt
    # LES ASPIRATEURS, ET EUX SEULS. Priorite 120.
    # Mesure du 31/08 : 97 % du trafic vient de DEUX signatures, Chrome sur
    # Windows et Chrome sur Mac, qui ne chargent aucune ressource (0 %, contre
    # 40 % pour un vrai iPhone) et demandent 152 494 pages differentes par heure.
    #
    # Pourquoi cette voie plutot qu une limite globale : une limite commune
    # arbitre mal quand 98 % du trafic est de l aspiration. A 90 places, la file
    # etait pleine en permanence et de vrais visiteurs recevaient un refus. A
    # 400, le site se noyait de nouveau (processeur a 278 %, /deposer-projet sans
    # reponse). Il n existe pas de bon reglage global : il faut viser la source.
    #
    # Cout assume : un vrai visiteur sur Chrome de bureau porte la meme signature
    # et peut etre refuse aux heures de pointe. Le trafic humain est d environ
    # 200 visites par jour, majoritairement mobile, et les mobiles ont leur voie
    # sans limite au-dessus. Refuser quelques visiteurs de bureau vaut mieux que
    # laisser tomber le site pour tout le monde.
    workwave-aspirateurs:
      entryPoints:
        - https
      rule: (Host(\`workwave.fr\`) || Host(\`www.workwave.fr\`)) && HeaderRegexp(\`User-Agent\`, \`^Mozilla/5\\.0 \\((Windows NT 10\\.0; Win64; x64|Macintosh; Intel Mac OS X 10_15_7)\\) AppleWebKit/537\\.36 \\(KHTML, like Gecko\\) Chrome/[0-9]+\\.0\\.0\\.0 Safari/537\\.36$\`)
      priority: 120
      middlewares:
        - workwave-limite-simultanee
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
    # REGLAGE FINAL DU 31/08 : 20 places.
    # 60 laissait encore le site saturer. Preuve : a 19h00 le piege a recu un
    # code 000 alors que le site repondait {"ok":true} EN DIRECT a la meme
    # seconde, avec le proxy a 22 % de processeur. Le site n etait pas mort, il
    # etait sature : les demandes faisaient la queue derriere les pages en cours
    # de fabrication. Le rendu est mono-file : au-dela d une dizaine de pages
    # simultanees, tout le monde attend.
    # 20 places pour les aspirateurs laisse le reste de la machine aux
    # visiteurs, qui passent par une voie SANS limite.
    #
    # 🔴 ERREUR DU 31/08 A NE PAS REFAIRE : le seuil a ete regle sur le DEBIT
    # (47 requetes par seconde) au lieu du nombre de places REELLEMENT occupees.
    # Une place reste prise pendant toute la fabrication de la page. A 47 req/s
    # et 5 s par page quand le site est charge, il faut 235 places, pas 90. Avec
    # 90, la file etait pleine en permanence et le site renvoyait 429 a de VRAIS
    # visiteurs : mesure a 18h20, cinq pages sur six en 429 depuis l exterieur.
    # La limite doit empecher l etouffement, pas remplacer la panne par un refus.
    # Regle de calcul : places = requetes par seconde x duree d une page, avec
    # une marge. Verifier apres chaque changement qu une page ordinaire repond
    # 200 DEPUIS L EXTERIEUR, pas seulement depuis le serveur.
    #
    # Reglage : 40 d abord (le site est remonte : processeur de 154 a 78 %,
    # charge de 6,36 a 3,96, memoire stable a 1 636 Mo), mais 40 places etaient
    # toutes prises par les aspirateurs et les visiteurs etaient refuses aussi.
    # Porte a 90, avec les moteurs de recherche exemptes par le routeur
    # ci-dessus. A reajuster en surveillant le processeur du site : s il repasse
    # durablement au-dessus de 150 %, redescendre.
    workwave-limite-simultanee:
      inFlightReq:
        amount: 20
    # File reservee aux telephones, independante de celle ci-dessus.
    workwave-limite-mobile:
      inFlightReq:
        amount: 30
    workwave-secours-compression:
      compress: {}
  services:
    workwave-secours-service:
      loadBalancer:
        servers:
          - url: "http://$C:3000"
YAML
echo "$(date '+%F %T') porte de secours pointee vers $C" >> /opt/workwave/porte-secours.log
