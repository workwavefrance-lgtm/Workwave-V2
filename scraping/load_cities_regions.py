"""
Charge les départements + communes de 4 nouvelles régions BTP dans Supabase :
Bretagne, Pays de la Loire, Occitanie, Provence-Alpes-Côte d'Azur.

Source communes : geo.api.gouv.fr (officiel, gratuit, pas de rate-limit).
- Idempotent : skip les communes dont l'insee_code existe déjà.
- Collision-aware : slug suffixé du code dépt si le slug bare existe déjà
  (en base OU dans ce run) → évite les URLs ambiguës / duplicate content.

Usage : cd scraping && venv/bin/python load_cities_regions.py
"""
import os
import re
import unicodedata
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# (code, nom, région) — 28 départements
DEPARTMENTS = [
    # Bretagne
    ("22", "Côtes-d'Armor", "Bretagne"), ("29", "Finistère", "Bretagne"),
    ("35", "Ille-et-Vilaine", "Bretagne"), ("56", "Morbihan", "Bretagne"),
    # Pays de la Loire
    ("44", "Loire-Atlantique", "Pays de la Loire"), ("49", "Maine-et-Loire", "Pays de la Loire"),
    ("53", "Mayenne", "Pays de la Loire"), ("72", "Sarthe", "Pays de la Loire"),
    ("85", "Vendée", "Pays de la Loire"),
    # Occitanie
    ("09", "Ariège", "Occitanie"), ("11", "Aude", "Occitanie"), ("12", "Aveyron", "Occitanie"),
    ("30", "Gard", "Occitanie"), ("31", "Haute-Garonne", "Occitanie"), ("32", "Gers", "Occitanie"),
    ("34", "Hérault", "Occitanie"), ("46", "Lot", "Occitanie"), ("48", "Lozère", "Occitanie"),
    ("65", "Hautes-Pyrénées", "Occitanie"), ("66", "Pyrénées-Orientales", "Occitanie"),
    ("81", "Tarn", "Occitanie"), ("82", "Tarn-et-Garonne", "Occitanie"),
    # Provence-Alpes-Côte d'Azur
    ("04", "Alpes-de-Haute-Provence", "Provence-Alpes-Côte d'Azur"),
    ("05", "Hautes-Alpes", "Provence-Alpes-Côte d'Azur"),
    ("06", "Alpes-Maritimes", "Provence-Alpes-Côte d'Azur"),
    ("13", "Bouches-du-Rhône", "Provence-Alpes-Côte d'Azur"),
    ("83", "Var", "Provence-Alpes-Côte d'Azur"), ("84", "Vaucluse", "Provence-Alpes-Côte d'Azur"),
]


def make_slug(name):
    s = unicodedata.normalize("NFD", name.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def upsert_departments():
    """Insère les 28 dépts (skip ceux déjà présents). Retourne {code: id}."""
    existing = {d["code"]: d["id"] for d in sb.table("departments").select("id, code").execute().data}
    to_add = [{"code": c, "name": n, "region": r} for (c, n, r) in DEPARTMENTS if c not in existing]
    if to_add:
        sb.table("departments").insert(to_add).execute()
        print(f"Départements ajoutés : {len(to_add)}")
    else:
        print("Départements : tous déjà présents")
    return {d["code"]: d["id"] for d in sb.table("departments").select("id, code").execute().data}


def load_all_slugs_and_insee():
    """Charge tous les slugs + insee_codes existants (pagination 1000)."""
    slugs, insee = set(), set()
    offset = 0
    while True:
        res = sb.table("cities").select("slug, insee_code").range(offset, offset + 999).execute()
        rows = res.data or []
        if not rows:
            break
        for r in rows:
            if r.get("slug"):
                slugs.add(r["slug"])
            if r.get("insee_code"):
                insee.add(r["insee_code"])
        offset += len(rows)
        if len(rows) < 1000:
            break
    return slugs, insee


def fetch_communes(dept_code):
    url = f"https://geo.api.gouv.fr/departements/{dept_code}/communes"
    params = {"fields": "nom,code,codesPostaux,population,centre", "format": "json"}
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def main():
    dept_ids = upsert_departments()
    print("Chargement des slugs + insee_codes existants...")
    slugs, insee_seen = load_all_slugs_and_insee()
    print(f"  {len(slugs)} slugs / {len(insee_seen)} insee_codes existants en base")

    grand_total = 0
    for code, name, region in DEPARTMENTS:
        dept_id = dept_ids[code]
        communes = fetch_communes(code)
        rows = []
        for c in communes:
            insee = c["code"]
            if insee in insee_seen:
                continue  # idempotent : déjà en base
            insee_seen.add(insee)
            base = make_slug(c["nom"])
            slug = base
            if slug in slugs:
                slug = f"{base}-{code}"  # collision -> suffixe dépt
            while slug in slugs:
                slug = f"{slug}b"  # ultra-rare : même nom même dépt
            slugs.add(slug)
            coords = (c.get("centre") or {}).get("coordinates", [None, None]) or [None, None]
            cps = c.get("codesPostaux", [])
            rows.append({
                "department_id": dept_id, "name": c["nom"], "slug": slug,
                "postal_code": cps[0] if cps else None, "insee_code": insee,
                "population": c.get("population"),
                "longitude": coords[0] if coords else None,
                "latitude": coords[1] if coords else None,
            })
        for i in range(0, len(rows), 100):
            sb.table("cities").insert(rows[i:i + 100]).execute()
        grand_total += len(rows)
        print(f"  [{code}] {name:28s} {region:28s} +{len(rows)} communes")

    print(f"\nTERMINÉ : {grand_total} communes ajoutées sur 28 départements.")


if __name__ == "__main__":
    main()
