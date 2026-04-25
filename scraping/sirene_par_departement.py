"""
Scraping Sirene INSEE pour un departement donne (ou tous les NA).

Usage :
    python sirene_par_departement.py --departement 23                 # un dpt
    python sirene_par_departement.py --departement 23 --vertical btp  # filtre vertical
    python sirene_par_departement.py --departement 23 --test plombier # une seule cat
    python sirene_par_departement.py --tous                           # tous les NA sauf 86
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
REQUEST_DELAY = 2  # secondes entre chaque requete (max 30 req/min)

# Liste des departements de Nouvelle-Aquitaine (ordre du plus petit au plus gros)
NA_DEPARTEMENTS = [
    "23",  # Creuse
    "19",  # Correze
    "87",  # Haute-Vienne
    "79",  # Deux-Sevres
    "16",  # Charente
    "17",  # Charente-Maritime
    "24",  # Dordogne
    "47",  # Lot-et-Garonne
    "40",  # Landes
    "64",  # Pyrenees-Atlantiques
    "33",  # Gironde (le plus gros, en dernier)
]


def make_slug(name):
    slug = unicodedata.normalize("NFD", name.lower())
    slug = "".join(c for c in slug if unicodedata.category(c) != "Mn")
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def make_unique_slug(name, siret):
    base = make_slug(name)
    suffix = siret[-5:] if siret else ""
    return f"{base}-{suffix}" if suffix else base


def extract_name(etab):
    ul = etab.get("uniteLegale", {})
    denom = ul.get("denominationUniteLegale")
    if denom and denom.strip():
        return denom.strip()
    prenom = ul.get("prenomUsuelUniteLegale", "") or ""
    nom = ul.get("nomUniteLegale", "") or ""
    full = f"{prenom} {nom}".strip()
    if full:
        return full
    denom_usuelle = etab.get("periodesEtablissement", [{}])[0].get(
        "denominationUsuelleEtablissement"
    )
    if denom_usuelle and denom_usuelle.strip():
        return denom_usuelle.strip()
    return "Entreprise sans nom"


def extract_address(adresse):
    parts = []
    for k in [
        "numeroVoieEtablissement",
        "indiceRepetitionEtablissement",
        "typeVoieEtablissement",
        "libelleVoieEtablissement",
    ]:
        v = adresse.get(k, "")
        if v:
            parts.append(v)
    return " ".join(parts) if parts else None


def format_naf(code):
    code = code.strip()
    if len(code) == 5 and "." not in code:
        return code[:2] + "." + code[2:]
    return code


def query_sirene(naf_code, dept_code, cursor=None):
    """Requete API Sirene pour un code NAF dans le departement specifie."""
    naf_formatted = format_naf(naf_code)
    # Code postal range : XX000 TO XX999 (les codes postaux commencent par le code dpt)
    cp_min = f"{dept_code}000"
    cp_max = f"{dept_code}999"

    q = (
        f"periode(activitePrincipaleEtablissement:{naf_formatted} "
        f"AND etatAdministratifEtablissement:A) "
        f"AND codePostalEtablissement:[{cp_min} TO {cp_max}]"
    )

    params = {"q": q, "nombre": PAGE_SIZE}
    if cursor:
        params["curseur"] = cursor

    headers = {
        "X-INSEE-Api-Key-Integration": INSEE_API_KEY,
        "Accept": "application/json",
    }

    resp = requests.get(SIRENE_BASE_URL, params=params, headers=headers, timeout=30)

    if resp.status_code == 404:
        return None, None, 0
    if resp.status_code == 429:
        print("    Rate limit, attente 60s...")
        time.sleep(60)
        return query_sirene(naf_code, dept_code, cursor)
    if resp.status_code == 503:
        print("    503 Maintenance, attente 30s...")
        time.sleep(30)
        return query_sirene(naf_code, dept_code, cursor)

    resp.raise_for_status()
    data = resp.json()

    etabs = data.get("etablissements", [])
    header = data.get("header", {})
    next_cursor = header.get("curseurSuivant")
    total = header.get("total", 0)

    if next_cursor == cursor:
        next_cursor = None

    return etabs, next_cursor, total


def scrape_departement(supabase, dept_code, categories, city_map):
    print(f"\n{'='*60}")
    print(f"DEPARTEMENT {dept_code}")
    print(f"{'='*60}")

    total_inserted = 0
    stats = []

    for cat in categories:
        cat_count = 0
        naf_codes = cat.get("naf_codes", [])
        if not naf_codes:
            print(f"\n[{cat['name']}] aucun NAF defini, skip")
            continue

        print(f"\n[{cat['name']}] NAF : {', '.join(naf_codes)}")

        for naf in naf_codes:
            cursor = None
            naf_count = 0

            while True:
                time.sleep(REQUEST_DELAY)
                etabs, next_cursor, total = query_sirene(naf, dept_code, cursor)

                if etabs is None:
                    print(f"  NAF {naf} : aucun resultat")
                    break

                if naf_count == 0:
                    print(f"  NAF {naf} : {total} etablissements trouves")

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

                # Dedup slugs dans le batch
                seen = set()
                unique_rows = []
                for row in rows:
                    slug = row["slug"]
                    while slug in seen:
                        slug = slug + "b"
                    seen.add(slug)
                    row["slug"] = slug
                    unique_rows.append(row)

                if unique_rows:
                    try:
                        supabase.table("pros").upsert(
                            unique_rows,
                            on_conflict="siret",
                            ignore_duplicates=True,
                        ).execute()
                        naf_count += len(unique_rows)
                    except Exception as e:
                        print(f"    Erreur batch ({e}), fallback unitaire...")
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
            print(f"  NAF {naf} : {naf_count} pros envoyes a upsert")

        total_inserted += cat_count
        stats.append((cat["name"], cat_count))
        print(f"  Total {cat['name']} : {cat_count}")

    print(f"\n{'-'*60}")
    print(f"RESUME DEPT {dept_code}")
    print(f"{'-'*60}")
    for name, count in stats:
        print(f"  {name:32s} : {count:5d}")
    print(f"\n  TOTAL upsert : {total_inserted}")

    # Vraie verification : count net en base pour ce departement
    # On compte les pros lies aux villes du departement
    dept_cities = supabase.table("cities").select("id").eq("department_id", get_dept_id(supabase, dept_code)).execute()
    city_ids = [c["id"] for c in dept_cities.data]
    if city_ids:
        # Supabase limite a 1000 in() values, mais 545 villes max = OK
        net_count = supabase.table("pros").select("id", count="exact").in_("city_id", city_ids).execute()
        print(f"  TOTAL net en base : {net_count.count}")

    return total_inserted


def get_dept_id(supabase, code):
    res = supabase.table("departments").select("id").eq("code", code).execute()
    return res.data[0]["id"] if res.data else None


def main():
    parser = argparse.ArgumentParser(description="Scraping Sirene par departement")
    parser.add_argument("--departement", help="Code dpt a scraper (ex: 23)")
    parser.add_argument("--tous", action="store_true", help="Scraper tous les NA sauf 86")
    parser.add_argument("--test", help="Une seule categorie (ex: --test plombier)")
    parser.add_argument("--vertical", choices=["btp", "domicile", "personne"])
    args = parser.parse_args()

    if not args.departement and not args.tous:
        parser.error("--departement XX OU --tous requis")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Charger les categories
    query = supabase.table("categories").select("id, slug, name, naf_codes, vertical")
    if args.test:
        query = query.eq("slug", args.test)
    if args.vertical:
        query = query.eq("vertical", args.vertical)
    result = query.execute()
    categories = result.data

    if not categories:
        print(f"Aucune categorie trouvee")
        sys.exit(1)

    print(f"Categories a traiter : {len(categories)}")

    # Charger TOUTES les villes pour le mapping insee_code -> city_id
    # Pagination car Supabase limite a 1000 par requete
    city_map = {}
    offset = 0
    while True:
        res = supabase.table("cities").select("id, insee_code").range(offset, offset + 999).execute()
        if not res.data:
            break
        for c in res.data:
            if c["insee_code"]:
                city_map[c["insee_code"]] = c["id"]
        if len(res.data) < 1000:
            break
        offset += 1000
    print(f"Villes chargees pour le mapping : {len(city_map)}")

    # Determiner les depts a traiter
    depts = NA_DEPARTEMENTS if args.tous else [args.departement]

    grand_total = 0
    for dept in depts:
        # Skip 86 dans --tous (deja fait)
        if args.tous and dept == "86":
            continue
        cnt = scrape_departement(supabase, dept, categories, city_map)
        grand_total += cnt

    print(f"\n{'='*60}")
    print(f"GRAND TOTAL : {grand_total} pros envoyes a upsert sur {len(depts)} dept(s)")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
