# Workwave — fiabilisation du 19 septembre 2026

## État vérifié

À 11:12 UTC / 13:12 Paris, Workwave sert toujours l'image `0ced424e4954be4d0f73145da55f517cdd7547fb`, conteneur `6088ef008c34`, démarré le 15 septembre à 12:55 UTC, zéro redémarrage. Aucun déploiement du site, arrêt du proxy ou changement de contenu SEO réalisé pendant cette intervention.

Disque : environ 286 Gio utilisés sur 387, 101–102 Gio disponibles (74 %), contre 75 Gio disponibles / 81 % lors du diagnostic du matin. La marge fluctue avec le trafic ; ce n'est pas encore un plafond du cache applicatif.

## Nettoyage sous pression : actif

Le nettoyage fonctionnait mais son seuil de 26 h laissait trop peu de fiches éligibles. Un échantillon de 5 431 HTML de statut 200 trouvait 26 fiches éligibles à 26 h, contre 1 398 à 18 h. Cet échantillon ne constitue pas une mesure exhaustive du volume.

`cache-maintenance.sh` conserve 26 h normalement et passe à 18 h lorsque `df` atteint 75 %. Plancher de sécurité de 18 h dans le programme lui-même. Protection des lectures HTML récentes et des écritures récentes de tous les segments conservée. Lots limités à 1 Gio, verrou exclusif, contrôles de santé, restauration du lot sur échec. Aucune suppression de bases, photos ou fichiers de construction.

Validation : 10 tests, canari de 230 pages / 67 047 424 octets avec contrôles passés, puis lots automatiques d'environ 1 Gio et contrôle de régénération. Le journal montre le retour à 26 h lorsque l'occupation repasse sous 75 %. Les alertes et leur cadence n'ont pas été modifiées.

## Blocage Coolify : cause confirmée et correctif actif

Docker 29.7.1, Coolify 4.3.12. La commande JSON utilisée par `getCurrentApplicationContainerStatus()` demandait implicitement `size=1` à Docker. Cela impose le calcul de la taille du conteneur, coûteux avec des centaines de milliers de fiches.

Preuve sans parcourir le cache : `scripts/ops/probe-docker-list.py` exécute le client Docker installé contre un faux daemon local isolé. Résultat :

- JSON ordinaire : requête API avec `all=1&size=1`.
- JSON avec `--size=false` : `all=1`, aucun calcul de taille.

Le helper Coolify utilise maintenant `--size=false` et un délai de 30 s par tentative SSH. Le mécanisme de retry de Coolify peut ajouter des tentatives : ce n'est pas un délai global garanti de 30 s. La vraie fonction Coolify répond en 0,204 à 0,414 s avec le bon conteneur sain.

Sauvegarde serveur : `/opt/workwave/coolify-hotfix/20260919T110237Z/docker.php`. SHA256 corrigé : `ea17acf79866082c9344e2e71472e2fafb5e9bd710faddf79a7e6d15be9a9eb8`.

## Bascule du proxy : protection active

Le trafic passe réellement par le service fichier `workwave-secours-service@file`, ciblant un nom de conteneur précis. Le précédent script choisissait simplement le conteneur le plus récent, toutes les cinq minutes, et écrivait la configuration en place. Deux autres tâches pouvaient arrêter les anciens conteneurs ou supprimer cette configuration avant sa réécriture. Cet ensemble pouvait créer une course pendant un déploiement.

Corrections :

1. `/opt/workwave/switch-proxy.py` valide l'état healthy, six routes (santé, accueil, dépôt, métier/ville, fiche LF CONCEPT, index de sitemaps), un fichier JavaScript et le canonique de la fiche. Il remplace atomiquement uniquement la cible du proxy. Il confirme ensuite, grâce à une requête identifiée dans le journal Traefik, que le nouveau conteneur répond publiquement. En cas d'échec après changement, il restaure le fichier précédent. Il ne démarre, n'arrête et ne supprime aucun conteneur.
2. Un hook ciblé sur l'application Workwave et ses déploiements de production exécute ce contrôle **avant** que Coolify arrête l'ancienne version saine. Délai global du hook : 120 s. Le mode de nommage constant ou les ports publiés sont refusés par le contrôle préalable.
3. `porte-secours.sh` garde maintenant la cible courante tant qu'elle est saine ; il ne choisit une autre cible saine qu'en secours. Les règles du proxy, la compression et les limites existantes sont conservées.
4. Les deux lignes cron `un-seul-conteneur.sh` et `remonter-limite.sh` sont commentées. Leurs anciens fichiers restent disponibles ; aucun conteneur n'a été arrêté par cette opération.

Sauvegardes du job PHP, du cron et de l'ancien sélecteur : `/opt/workwave/deploy-guard-backups/20260919T110938Z`. Les workers Horizon ont été rechargés gracieusement après vérification qu'aucun déploiement n'était actif ; application et proxy inchangés.

Validation : 7 tests (sélection sûre, refus d'une cible non saine, configuration ambiguë, conservation du fichier sur échec initial, restauration sur échec public, permissions préservées). Contrôle complet exécuté sur la cible déjà en production, avec preuve du routage effectif. **Une vraie bascule entre deux nouvelles versions n'a pas été exécutée aujourd'hui.**

Limite opérationnelle : si le hook échoue, l'ancien trafic reste servi et le retrait des anciens conteneurs est abandonné. Coolify peut malgré cela marquer le déploiement terminé avec un avertissement ; il faut vérifier la cible réellement servie après chaque déploiement.

## Retour arrière préparé

Snapshot protégé : `/opt/workwave/rollback/20260919T111012Z` : compose, environnement, configuration du proxy et manifeste. Ne pas copier son environnement dans le dépôt ni l'afficher.

- Image locale conservée : `workwave-rollback:0ced424e4954be4d0f73145da55f517cdd7547fb`.
- Identité : `sha256:d2cb94b4ef6d7135336f031e5bd22cfdd14dc34c8fcc28844675f16fb91b904d`.
- Conteneur de rétention créé mais jamais démarré : `workwave-rollback-pin-0ced424e4954`. Aucun secret, aucun réseau attaché. Il conserve une référence à l'image.
- Compose de secours validé et pointant explicitement sur cette image locale ; aucune reconstruction nécessaire.

En cas de régression après un futur déploiement : suspendre tout autre déploiement, vérifier le manifeste et l'image, remettre en marche la version conservée via son compose sans build ni pull, attendre son état healthy, puis exécuter `switch-proxy.py --target NOM_CONSERVÉ`. Retirer la version défaillante seulement après contrôle public. Ne pas utiliser `docker compose down` ni de purge globale.

La restauration complète n'a pas été répétée sur le site vivant : seuls la disponibilité de l'image, le compose et les contrôles du moteur de bascule ont été validés. Les changements futurs de schéma de base devront aussi rester compatibles avec le retour arrière.

## Barrière avant les prochains déploiements

Sur le VPS, exécuter `python3 /opt/workwave/deployment-preflight.py` juste avant le lancement. Il ne déclenche rien. Il vérifie les deux correctifs Coolify, l'absence de déploiement concurrent, le mode de conteneur, la correspondance proxy/conteneur, le snapshot de retour arrière, l'image, au moins 80 Gio libres, l'absence de désactivation du nettoyage et des anciens automatismes dangereux, puis les routes publiques.

Résultat aujourd'hui : `preflight: passed`, 101,2 Gio disponibles. Il s'agit d'un contrôle préalable explicite, pas d'une interception automatique de tous les clics de déploiement dans Coolify.

**Les correctifs PHP sont locaux au conteneur Coolify et peuvent disparaître lors d'une mise à jour de Coolify.** Le contrôle préalable doit alors bloquer le lancement jusqu'à réévaluation. Ne pas réappliquer aveuglément les patches à une autre version. Faire évoluer cette protection vers une solution intégrée et maintenue avant une mise à jour d'infrastructure.

## Erreurs ponctuelles : diagnostic, sans conclusion prématurée

Fenêtre bornée des journaux : 08:41:15–11:03:55 UTC, 115 423 requêtes. Neuf 502 sur POST `/api/track` ou `/api/agent-context`, avec `OriginStatus=0` et environ 0,4–0,5 ms ; aucune page GET en 5xx dans cette fenêtre. Aucun message d'exception correspondant dans les 1 500 dernières lignes applicatives examinées, ni dans les 150 dernières lignes du proxy. Cela ne couvre pas tous les incidents historiques.

Incohérence confirmée : Next renvoie `Keep-Alive: timeout=5`, tandis qu'aucun délai spécifique n'est configuré pour le service Traefik (défaut documenté 90 s). La réutilisation d'une connexion fermée est une hypothèse compatible avec ces 502 rapides, pas une causalité établie pour chacun des neuf cas.

Préparé **localement seulement** : `package.json` démarre Next avec `--keepAliveTimeout 120000`. Option vérifiée dans les docs et la CLI de Next 16.2.3. À inclure dans le prochain lot applicatif, puis mesurer les 502 après déploiement. Aucun redémarrage de production pour ce changement aujourd'hui.

Sources : [Next : délais derrière un proxy](https://nextjs.org/docs/app/api-reference/cli/next#configuring-a-timeout-for-downstream-proxies), [Traefik 3.6 : ServersTransport](https://doc.traefik.io/traefik/v3.6/reference/routing-configuration/http/load-balancing/serverstransport/), [Docker CLI : détection implicite du champ Size](https://github.com/docker/cli/blob/v29.5.3/cli/command/container/list.go). Le comportement exact du client 29.7.1 a été confirmé par le test isolé, indépendamment de cette référence de source.

## Plafond du cache : prochain lot applicatif, non réalisé

Next stocke les pages générées dans `/app/.next/server/app`, actuellement dans la couche du conteneur. Le volume `/app/.next/cache` ne contient donc pas l'essentiel de ce problème. Diminuer uniquement `cacheMaxMemorySize` ne plafonne pas le disque. Le montant de 790 Go transmis par Claude reste une projection, non une mesure exhaustive.

Mesure LF CONCEPT : HTML 148 164 octets, RSC 68 652, métadonnées 398, huit segments totalisant 137 463, soit **354 677 octets logiques / 380 928 octets alloués**. HTML réellement téléchargé avec gzip : **23 009 octets**. Ce dernier chiffre exclut les scripts, images, styles et requêtes de navigation ; ce n'est pas le poids total de la page.

Le prochain lot doit fournir un stockage ISR réellement borné, avec comptabilisation et éviction atomiques sous accès concurrents, une marge pour les écritures, métadonnées et journaux, une réserve pour le build et le retour arrière. Étudier aussi la compression des artefacts, sans supprimer les contenus et liens SEO pour réduire artificiellement le poids.

Critères de validation avant activation : dépassement de quota sous charge borné ; lecture après éviction sans 404 artificielle ; données RSC/segments intactes ; invalidation des fiches après édition/suppression ; balises canoniques et statuts conservés ; démarrage après interruption ; fallback des pages préconstruites ; isolation entre versions ; mesure du CPU, de la latence et de la charge Supabase. Ne pas annoncer « plus jamais de problème » ni déployer un gestionnaire de cache ad hoc sans ces vérifications.

Après cette stabilisation : travailler les pages d'entrée et leurs CTA à partir des conversions mesurées. Séparer ce lot SEO/UX du changement de cache pour pouvoir attribuer les résultats et revenir en arrière proprement.
