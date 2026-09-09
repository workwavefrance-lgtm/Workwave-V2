#!/usr/bin/env python3
"""
stats-jour.py : calcule, pour UN jour, les colonnes Umami et robots de la table
`stats_jour` et les POSTe sur https://workwave.fr/api/cron/stats-jour.

POURQUOI (09/09/2026) : les mesures d'audience de Workwave.fr vivaient dans
trois outils qui ne se parlent pas. Umami (visiteurs humains, JS execute) et le
journal du proxy Traefik (robots, Google, aspirateurs, erreurs) sont tous deux
sur le VPS : ce script les lit sur place et n'envoie QUE ses colonnes (upsert
partiel), pour ne jamais ecraser celles du script Search Console du Mac.

Il tourne sur le VPS (72.60.130.5) en root, stdlib uniquement, aucune
dependance a installer. Il ne se connecte a rien d'autre que le conteneur
Postgres d'Umami (docker exec) et l'API du site.

USAGE :
    python3 stats-jour.py                  # aujourd'hui (date UTC)
    python3 stats-jour.py 2026-09-08       # un jour precis
    python3 stats-jour.py hier             # la veille (date UTC), sans passer par `date`
    python3 stats-jour.py 2026-09-08 --sans-envoi   # calcule et affiche, ne POSTe pas

Le secret est lu dans CRON_SECRET, sinon dans /opt/workwave/.cron-secret (une ligne).

CRONTAB A INSTALLER (root, `crontab -e`). Le VPS doit etre a l'heure UTC
(`timedatectl` : Time zone: Etc/UTC), sinon decaler la 2e ligne pour qu'elle
tombe a 00:12 UTC. Le `\\%` est obligatoire : dans un crontab, un `%` nu est
transforme en saut de ligne.

    7 * * * *  /usr/bin/python3 /opt/workwave/stats-jour.py >> /var/log/workwave-stats-jour.log 2>&1
    12 0 * * * /usr/bin/python3 /opt/workwave/stats-jour.py "$(date -u -d yesterday +\\%F)" >> /var/log/workwave-stats-jour.log 2>&1

La 1re ligne remplit le jour courant toutes les heures (valeurs partielles,
remplacees a chaque passage). La 2e fige la veille une fois ses 24 h ecoulees.

CE QUE VAUT UNE ABSENCE : si Umami est injoignable, ou si le journal du proxy
ne contient AUCUNE ligne pour la date, les colonnes correspondantes ne sont
pas envoyees (elles restent NULL en base = « pas mesure »). Un zero n'est
envoye que quand la source a bien ete lue et a compte zero.

DEFINITIONS (contrat stats_jour, a ne pas reinterpreter) :
  - sessions/vues : Umami, event_type = 1 (vue de page), site workwave.fr.
  - sessions_depot : sessions avec au moins une vue dont url_path commence par
    /deposer-projet ; sessions_fiche : /artisan/ ; sessions_accueil : url_path = '/'.
  - sessions_listing : url_path de la forme /<metier>/<lieu> (2 segments), hors
    /artisan, /ai, /en, /blog, /guide-des-prix, /pro, /admin, /departements, /recherche.
  - src_* : referrer_domain de la PREMIERE vue de la session : contient google
    -> google ; bing -> bing ; instagram -> instagram ; vide ou workwave.fr ->
    direct ; sinon autre.
  - requete HTML : hors /_next, /api et fichiers statiques (dernier segment avec
    une extension).
  - robots_declares : requetes HTML dont l'agent contient bot|crawl|spider|slurp|
    curl|python|wget|headless|lighthouse|facebookexternalhit|preview|monitor|
    uptime|scan|go-http|java/|okhttp (insensible a la casse), OU adresse 66.249.*.
  - google_passages : toutes les requetes des adresses 66.249.* ; google_5xx :
    celles en statut 5xx.
  - aspirateur_adresses : adresses NON declarees (agent sans mot-cle, pas
    66.249.*) qui ont demande au moins 1 page HTML et n'ont JAMAIS charge
    /_next/static/ dans la journee ; aspirateur_pages : leurs requetes HTML.
  - err_5xx_total : toutes les reponses 5xx sur les hotes contenant workwave.fr.
"""
from __future__ import annotations

import gzip
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Iterator, Optional

# ---------------------------------------------------------------------------
# Reglages. Les variables d'environnement STATS_JOUR_* ne servent qu'aux tests
# (pointer un autre journal, une autre URL) ; en production on ne les pose pas.
# ---------------------------------------------------------------------------
URL_API = os.environ.get("STATS_JOUR_URL", "https://workwave.fr/api/cron/stats-jour")
FICHIER_SECRET = "/opt/workwave/.cron-secret"

DOSSIER_JOURNAL = os.environ.get("STATS_JOUR_JOURNAL_DIR", "/data/coolify/proxy")
# Ordre de lecture : le journal courant, puis la rotation de la veille. logrotate
# (copytruncate + compress, cf. /etc/logrotate.d/traefik-workwave) tourne a une
# heure variable dans la journee : les lignes de la date cherchee peuvent etre
# dans n'importe lequel des trois, d'ou le filtre sur StartUTC ligne par ligne.
FICHIERS_JOURNAL = ("access.log", "access.log.1", "access.log.1.gz")

CONTENEUR_UMAMI = os.environ.get("STATS_JOUR_UMAMI_CONTENEUR", "umami-db")
DOMAINES_UMAMI = ("workwave.fr", "www.workwave.fr")

PREFIXE_GOOGLE = "66.249."
RE_ROBOT = re.compile(
    r"bot|crawl|spider|slurp|curl|python|wget|headless|lighthouse|facebookexternalhit"
    r"|preview|monitor|uptime|scan|go-http|java/|okhttp",
    re.IGNORECASE,
)
# Un dernier segment d'URL avec une extension (.js, .png, .xml, .txt, .woff2...)
# est un fichier statique, jamais une page HTML de Workwave.fr : les slugs des
# pages (metiers, communes, fiches, guides) ne contiennent pas de point.
RE_EXTENSION = re.compile(r"\.[a-z0-9]{1,5}$")

COLONNES_UMAMI = (
    "sessions", "vues",
    "sessions_depot", "sessions_listing", "sessions_fiche", "sessions_accueil",
    "src_google", "src_bing", "src_instagram", "src_direct", "src_autre",
)
COLONNES_ROBOTS = (
    "robots_declares", "google_passages", "google_5xx",
    "aspirateur_pages", "aspirateur_adresses", "err_5xx_total",
)


def horodatage() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def info(message: str) -> None:
    print(f"[{horodatage()}] {message}", flush=True)


def avertir(message: str) -> None:
    print(f"[{horodatage()}] AVERTISSEMENT : {message}", file=sys.stderr, flush=True)


# ---------------------------------------------------------------------------
# Jour cible
# ---------------------------------------------------------------------------
def jour_cible(arguments: list[str]) -> str:
    """Argument 1 = AAAA-MM-JJ ou `hier` ; defaut = aujourd'hui en UTC."""
    aujourdhui = datetime.now(timezone.utc).date()
    if not arguments:
        return aujourdhui.isoformat()
    brut = arguments[0]
    if brut == "hier":
        return (aujourdhui - timedelta(days=1)).isoformat()
    try:
        return datetime.strptime(brut, "%Y-%m-%d").date().isoformat()
    except ValueError:
        raise SystemExit(f"jour invalide : {brut!r} (attendu AAAA-MM-JJ ou `hier`)")


def lendemain_de(jour: str) -> str:
    return (datetime.strptime(jour, "%Y-%m-%d").date() + timedelta(days=1)).isoformat()


# ---------------------------------------------------------------------------
# Umami : une seule requete, bornee [jour 00:00, lendemain 00:00) UTC
# ---------------------------------------------------------------------------
def sql_umami(jour: str, lendemain: str) -> str:
    domaines = ", ".join(f"'{d}'" for d in DOMAINES_UMAMI)
    # `ref` est passe en minuscules une fois pour toutes : les LIKE qui suivent
    # sont donc insensibles a la casse. La premiere vue d'une session est celle
    # de created_at minimal (event_id departage les egalites, sinon le choix
    # pourrait varier d'une execution a l'autre).
    return f"""
WITH site AS (
  SELECT website_id FROM website WHERE lower(domain) IN ({domaines})
),
vues AS (
  SELECT e.event_id, e.session_id, e.url_path, e.created_at,
         lower(coalesce(e.referrer_domain, '')) AS ref
  FROM website_event e
  WHERE e.website_id IN (SELECT website_id FROM site)
    AND e.event_type = 1
    AND e.created_at >= timestamptz '{jour} 00:00:00+00'
    AND e.created_at <  timestamptz '{lendemain} 00:00:00+00'
),
sessions AS (
  SELECT session_id,
         bool_or(url_path LIKE '/deposer-projet%') AS depot,
         bool_or(url_path = '/')                    AS accueil,
         bool_or(url_path LIKE '/artisan/%')        AS fiche,
         bool_or(url_path ~ '^/[^/]+/[^/]+/?$'
                 AND url_path !~ '^/(artisan|ai|en|blog|guide-des-prix|pro|admin|departements|recherche)(/|$)') AS listing
  FROM vues
  GROUP BY session_id
),
premieres AS (
  SELECT DISTINCT ON (session_id) session_id,
         CASE
           WHEN ref LIKE '%google%'    THEN 'google'
           WHEN ref LIKE '%bing%'      THEN 'bing'
           WHEN ref LIKE '%instagram%' THEN 'instagram'
           WHEN ref = '' OR ref LIKE '%workwave.fr%' THEN 'direct'
           ELSE 'autre'
         END AS src
  FROM vues
  ORDER BY session_id, created_at, event_id
)
SELECT
  (SELECT count(*) FROM site),
  (SELECT count(*) FROM vues),
  (SELECT count(*) FROM sessions),
  (SELECT count(*) FILTER (WHERE depot)   FROM sessions),
  (SELECT count(*) FILTER (WHERE listing) FROM sessions),
  (SELECT count(*) FILTER (WHERE fiche)   FROM sessions),
  (SELECT count(*) FILTER (WHERE accueil) FROM sessions),
  (SELECT count(*) FILTER (WHERE src = 'google')    FROM premieres),
  (SELECT count(*) FILTER (WHERE src = 'bing')      FROM premieres),
  (SELECT count(*) FILTER (WHERE src = 'instagram') FROM premieres),
  (SELECT count(*) FILTER (WHERE src = 'direct')    FROM premieres),
  (SELECT count(*) FILTER (WHERE src = 'autre')     FROM premieres);
"""


def mesurer_umami(jour: str) -> Optional[dict[str, int]]:
    """Retourne les colonnes Umami, ou None si la mesure n'a pas pu etre faite."""
    commande = [
        "docker", "exec", CONTENEUR_UMAMI,
        "psql", "-U", "umami", "-d", "umami", "-X", "-At", "-F", "|",
        "-c", sql_umami(jour, lendemain_de(jour)),
    ]
    try:
        resultat = subprocess.run(commande, capture_output=True, text=True, timeout=120)
    except FileNotFoundError:
        avertir("docker introuvable : colonnes Umami non mesurees")
        return None
    except subprocess.TimeoutExpired:
        avertir("psql Umami n'a pas repondu en 120 s : colonnes Umami non mesurees")
        return None
    if resultat.returncode != 0:
        avertir(f"psql Umami a echoue (code {resultat.returncode}) : {resultat.stderr.strip()[:300]}")
        return None

    ligne = resultat.stdout.strip().splitlines()
    if len(ligne) != 1:
        avertir(f"psql Umami : 1 ligne attendue, {len(ligne)} recue(s) : colonnes Umami non mesurees")
        return None
    try:
        valeurs = [int(v) for v in ligne[0].split("|")]
    except ValueError:
        avertir(f"psql Umami : sortie illisible {ligne[0]!r}")
        return None
    if len(valeurs) != 1 + len(COLONNES_UMAMI):
        avertir(f"psql Umami : {len(valeurs)} colonnes recues, {1 + len(COLONNES_UMAMI)} attendues")
        return None

    nb_sites, compteurs = valeurs[0], valeurs[1:]
    # Zero site trouve = zero vue par construction : ce serait un faux zero, pas
    # une mesure. On ne l'envoie pas.
    if nb_sites == 0:
        avertir(f"aucun site {DOMAINES_UMAMI} dans la table website d'Umami : colonnes Umami non mesurees")
        return None
    return dict(zip(COLONNES_UMAMI, compteurs))


# ---------------------------------------------------------------------------
# Journal du proxy Traefik (JSON par ligne)
# ---------------------------------------------------------------------------
def lire_lignes(chemin: str) -> Iterator[str]:
    ouvrir = gzip.open if chemin.endswith(".gz") else open
    with ouvrir(chemin, "rt", encoding="utf-8", errors="replace") as f:
        for ligne in f:
            yield ligne


def fichiers_a_lire() -> list[str]:
    presents = [os.path.join(DOSSIER_JOURNAL, n) for n in FICHIERS_JOURNAL]
    presents = [p for p in presents if os.path.isfile(p)]
    # access.log.1 et access.log.1.gz ne coexistent qu'un instant, pendant la
    # compression : si les deux sont la, ils ont le meme contenu, on ne lit que
    # le clair pour ne pas compter deux fois.
    clair = os.path.join(DOSSIER_JOURNAL, "access.log.1")
    comprime = clair + ".gz"
    if clair in presents and comprime in presents:
        presents.remove(comprime)
    return presents


def est_html(chemin: str) -> bool:
    if not chemin.startswith("/"):
        return False
    if chemin == "/_next" or chemin.startswith("/_next/"):
        return False
    if chemin == "/api" or chemin.startswith("/api/"):
        return False
    dernier = chemin.rsplit("/", 1)[-1].lower()
    return RE_EXTENSION.search(dernier) is None


def mesurer_journal(jour: str) -> Optional[dict[str, int]]:
    """Retourne les colonnes robots, ou None si aucune ligne du jour n'a ete lue."""
    fichiers = fichiers_a_lire()
    if not fichiers:
        avertir(f"aucun journal dans {DOSSIER_JOURNAL} : colonnes robots non mesurees")
        return None

    total = 0
    err_5xx_total = 0
    google_passages = 0
    google_5xx = 0
    robots_declares = 0
    # ip -> [pages HTML non declarees, a charge /_next/static/]
    par_adresse: dict[str, list] = {}
    lignes_illisibles = 0

    for fichier in fichiers:
        try:
            for ligne in lire_lignes(fichier):
                # Pre-filtre textuel, bien moins cher que json.loads sur ~1 M de
                # lignes/jour ; le vrai controle se fait sur les champs ensuite.
                if jour not in ligne or "workwave.fr" not in ligne:
                    continue
                try:
                    d = json.loads(ligne)
                except ValueError:
                    lignes_illisibles += 1
                    continue
                if "workwave.fr" not in (d.get("RequestHost") or ""):
                    continue
                if not (d.get("StartUTC") or "").startswith(jour):
                    continue

                total += 1
                adresse = d.get("ClientHost") or ""
                chemin = (d.get("RequestPath") or "").split("?", 1)[0]
                agent = d.get("request_User-Agent") or ""
                try:
                    statut = int(d.get("DownstreamStatus") or 0)
                except (TypeError, ValueError):
                    statut = 0
                est_5xx = 500 <= statut <= 599
                est_google = adresse.startswith(PREFIXE_GOOGLE)

                if est_5xx:
                    err_5xx_total += 1
                if est_google:
                    google_passages += 1
                    if est_5xx:
                        google_5xx += 1

                compte = par_adresse.setdefault(adresse, [0, False])
                if chemin.startswith("/_next/static/"):
                    compte[1] = True
                if est_html(chemin):
                    if est_google or RE_ROBOT.search(agent):
                        robots_declares += 1
                    else:
                        compte[0] += 1
        except OSError as e:
            avertir(f"lecture impossible de {fichier} : {e}")

    if lignes_illisibles:
        avertir(f"{lignes_illisibles} ligne(s) du journal non JSON ignoree(s)")
    if total == 0:
        # Sur un site a ~1 M de requetes/jour, zero ligne pour la date veut dire
        # « le journal ne couvre pas ce jour » (date trop ancienne, rotation),
        # jamais « personne n'est venu ». On n'envoie pas de faux zero.
        avertir(f"aucune requete workwave.fr datee du {jour} dans {', '.join(fichiers)} : colonnes robots non mesurees")
        return None

    aspirateur_adresses = 0
    aspirateur_pages = 0
    for pages, a_charge_static in par_adresse.values():
        if pages > 0 and not a_charge_static:
            aspirateur_adresses += 1
            aspirateur_pages += pages

    info(f"journal : {total} requetes workwave.fr le {jour} dans {len(fichiers)} fichier(s), {len(par_adresse)} adresses")
    return {
        "robots_declares": robots_declares,
        "google_passages": google_passages,
        "google_5xx": google_5xx,
        "aspirateur_pages": aspirateur_pages,
        "aspirateur_adresses": aspirateur_adresses,
        "err_5xx_total": err_5xx_total,
    }


# ---------------------------------------------------------------------------
# Envoi
# ---------------------------------------------------------------------------
def lire_secret() -> str:
    secret = (os.environ.get("CRON_SECRET") or "").strip()
    if secret:
        return secret
    try:
        with open(FICHIER_SECRET, encoding="utf-8") as f:
            secret = f.readline().strip()
    except OSError:
        secret = ""
    if not secret:
        raise SystemExit(f"secret introuvable : ni CRON_SECRET ni {FICHIER_SECRET}")
    return secret


def envoyer(charge: dict, secret: str) -> int:
    """POSTe la charge, affiche la reponse, retourne le code HTTP (0 si reseau KO)."""
    corps = json.dumps(charge).encode("utf-8")
    requete = urllib.request.Request(
        URL_API,
        data=corps,
        method="POST",
        headers={
            "Authorization": f"Bearer {secret}",
            "Content-Type": "application/json",
            "User-Agent": "Workwave-StatsJour/1.0 (+contact@workwave.fr)",
        },
    )
    try:
        with urllib.request.urlopen(requete, timeout=60) as reponse:
            code = reponse.status
            texte = reponse.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        code = e.code
        texte = e.read().decode("utf-8", errors="replace")
    except urllib.error.URLError as e:
        info(f"HTTP KO : {e.reason}")
        return 0
    info(f"HTTP {code} {texte.strip()[:500]}")
    return code


def main(arguments: list[str]) -> int:
    sans_envoi = "--sans-envoi" in arguments
    positionnels = [a for a in arguments if not a.startswith("--")]
    jour = jour_cible(positionnels)
    info(f"stats-jour : jour cible {jour}")

    charge: dict = {"jour": jour}
    umami = mesurer_umami(jour)
    if umami:
        charge.update(umami)
    journal = mesurer_journal(jour)
    if journal:
        charge.update(journal)

    print(json.dumps(charge, ensure_ascii=False), flush=True)

    if len(charge) == 1:
        info("rien a envoyer : aucune source n'a pu etre mesuree")
        return 1
    if sans_envoi:
        info("--sans-envoi : pas de POST")
        return 0

    code = envoyer(charge, lire_secret())
    return 0 if code == 200 else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
