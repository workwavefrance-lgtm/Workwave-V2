"""
Scraping de l'API Sirene (INSEE) pour récupérer les professionnels
du département de la Vienne (86) et les insérer dans Supabase.

Usage :
    python sirene_vienne.py              # toutes les catégories
    python sirene_vienne.py --test plombier  # une seule catégorie (test)
"""

import argparse
import os
import re
import sys
import time
import unicodedata

import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
INSEE_API_KEY = os.environ["INSEE_API_KEY"]

SIRENE_BASE_URL = "https://api.insee.fr/api-sirene/3.11/siret"
PAGE_SIZE = 1000
REQUEST_DELAY = 2  # secondes entre chaque requête (max 30 req/min)


def make_slug(name):
    """Génère un slug unique à partir d'un nom d'entreprise."""
    slug = unicodedata.normalize("NFD", name.lower())
    slug = "".join(c for c in slug if unicodedata.category(c) != "Mn")
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def make_unique_slug(name, siret):
    """Slug avec les 5 derniers chiffres du SIRET pour éviter les collisions."""
    base = make_slug(name)
    suffix = siret[-5:] if siret else ""
    return f"{base}-{suffix}" if suffix else base


def extract_name(etab):
    """Extrait le nom de l'établissement depuis la réponse Sirene."""
    ul = etab.get("uniteLegale", {})

    # Entreprise : dénomination
    denom = ul.get("denominationUniteLegale")
    if denom and denom.strip():
        return denom.strip()

    # Entrepreneur individuel : prénom + nom
    prenom = ul.get("prenomUsuelUniteLegale", "") or ""
    nom = ul.get("nomUniteLegale", "") or ""
    full = f"{prenom} {nom}".strip()
    if full:
        return full

    # Fallback : dénomination usuelle de l'établissement
    denom_usuelle = etab.get("periodesEtablissement", [{}])[0].get(
        "denominationUsuelleEtablissement"
    )
    if denom_usuelle and denom_usuelle.strip():
        return denom_usuelle.strip()

    return "Entreprise sans nom"


def extract_address(adresse):
    """Construit l'adresse complète depuis les champs Sirene."""
    parts = []
    numero = adresse.get("numeroVoieEtablissement", "")
    if numero:
        parts.append(numero)

    indice = adresse.get("indiceRepetitionEtablissement", "")
    if indice:
        parts.append(indice)

    type_voie = adresse.get("typeVoieEtablissement", "")
    if type_voie:
        parts.append(type_voie)

    libelle = adresse.get("libelleVoieEtablissement", "")
    if libelle:
        parts.append(libelle)

    return " ".join(parts) if parts else None


def format_naf(code):
    """Convertit un code NAF sans point (4322A) en format API (43.22A)."""
    code = code.strip()
    if len(code) == 5 and "." not in code:
        return code[:2] + "." + code[2:]
    return code


def query_sirene(naf_code, cursor=None):
    """Requête l'API Sirene pour un code NAF dans le département 86."""
    naf_formatted = format_naf(naf_code)
    q = (
        f"periode(activitePrincipaleEtablissement:{naf_formatted} "
        f"AND etatAdministratifEtablissement:A) "
        f"AND codePostalEtablissement:[86000 TO 86999]"
    )

    params = {
        "q": q,
        "nombre": PAGE_SIZE,
    }
    if cursor:
        params["curseur"] = cursor

    headers = {
        "X-INSEE-Api-Key-Integration": INSEE_API_KEY,
        "Accept": "application/json",
    }

    resp = requests.get(SIRENE_BASE_URL, params=params, headers=headers, timeout=30)

    if resp.status_code == 404:
        # Aucun résultat pour ce code NAF
        return None, None, 0

    if resp.status_code == 429:
        # Rate limit atteint, attendre et réessayer
        print("    Rate limit atteint, attente de 60s...")
        time.sleep(60)
        return query_sirene(naf_code, cursor)

    if resp.status_code == 503:
        # Maintenance, attendre et réessayer
        print("    API indisponible (503), attente de 30s...")
        time.sleep(30)
        return query_sirene(naf_code, cursor)

    resp.raise_for_status()
    data = resp.json()

    etabs = data.get("etablissements", [])
    header = data.get("header", {})
    next_cursor = header.get("curseurSuivant")
    total = header.get("total", 0)

    # Si le curseur suivant est identique au précédent, on a fini
    if next_cursor == cursor:
        next_cursor = None

    return etabs, next_cursor, total


def main():
    parser = argparse.ArgumentParser(description="Scraping Sirene → Supabase")
    parser.add_argument(
        "--test",
        metavar="SLUG",
        help="Tester sur une seule catégorie (ex: --test plombier)",
    )
    args = parser.parse_args()

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Charger les catégories
    query = supabase.table("categories").select("id, slug, name, naf_codes")
    if args.test:
        query = query.eq("slug", args.test)
    result = query.execute()
    categories = result.data

    if not categories:
        print(f"Aucune catégorie trouvée" + (f" avec le slug '{args.test}'" if args.test else ""))
        sys.exit(1)

    print(f"Catégories à traiter : {len(categories)}")

    # Charger les villes pour le mapping insee_code → city_id
    cities_result = supabase.table("cities").select("id, insee_code").execute()
    city_map = {c["insee_code"]: c["id"] for c in cities_result.data if c["insee_code"]}
    print(f"Villes chargées pour le mapping : {len(city_map)}")

    total_inserted = 0
    stats = []

    for cat in categories:
        cat_count = 0
        naf_codes = cat.get("naf_codes", [])

        if not naf_codes:
            print(f"\n[{cat['name']}] Aucun code NAF défini, ignoré.")
            continue

        print(f"\n[{cat['name']}] Codes NAF : {', '.join(naf_codes)}")

        for naf in naf_codes:
            cursor = None
            naf_count = 0

            while True:
                time.sleep(REQUEST_DELAY)
                etabs, next_cursor, total = query_sirene(naf, cursor)

                if etabs is None:
                    print(f"  NAF {naf} : aucun résultat")
                    break

                if naf_count == 0:
                    print(f"  NAF {naf} : {total} établissements trouvés")

                rows = []
                for etab in etabs:
                    siret = etab.get("siret", "")
                    if not siret:
                        continue

                    adresse = etab.get("adresseEtablissement", {})
                    insee_code = adresse.get("codeCommuneEtablissement", "")
                    postal_code = adresse.get("codePostalEtablissement", "")

                    name = extract_name(etab)

                    rows.append({
                        "slug": make_unique_slug(name, siret),
                        "name": name,
                        "siret": siret,
                        "siren": siret[:9],
                        "category_id": cat["id"],
                        "address": extract_address(adresse),
                        "city_id": city_map.get(insee_code),
                        "postal_code": postal_code or None,
                        "source": "sirene",
                        "naf_code": naf,
                    })

                # Dédupliquer les slugs dans le batch
                seen_slugs = set()
                unique_rows = []
                for row in rows:
                    slug = row["slug"]
                    while slug in seen_slugs:
                        slug = slug + "b"
                    seen_slugs.add(slug)
                    row["slug"] = slug
                    unique_rows.append(row)

                # Upsert par batch (ignore les doublons sur siret)
                if unique_rows:
                    try:
                        supabase.table("pros").upsert(
                            unique_rows,
                            on_conflict="siret",
                            ignore_duplicates=True,
                        ).execute()
                        naf_count += len(unique_rows)
                    except Exception as e:
                        # Fallback : insertion ligne par ligne
                        print(f"    Erreur batch, fallback ligne par ligne...")
                        for row in unique_rows:
                            try:
                                supabase.table("pros").upsert(
                                    row,
                                    on_conflict="siret",
                                    ignore_duplicates=True,
                                ).execute()
                                naf_count += 1
                            except Exception:
                                pass

                if not next_cursor:
                    break
                cursor = next_cursor

            cat_count += naf_count
            print(f"  NAF {naf} : {naf_count} pros insérés")

        total_inserted += cat_count
        stats.append((cat["name"], cat_count))
        print(f"  → Total {cat['name']} : {cat_count}")

    # Résumé final
    print("\n" + "=" * 50)
    print("RÉSUMÉ")
    print("=" * 50)
    for name, count in stats:
        print(f"  {name:30s} : {count:5d}")
    print(f"\n  TOTAL : {total_inserted} professionnels insérés")


if __name__ == "__main__":
    main()
