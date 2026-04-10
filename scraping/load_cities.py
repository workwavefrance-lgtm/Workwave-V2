"""
Charge toutes les communes de la Vienne (86) depuis l'API geo.api.gouv.fr
et les insère dans la table cities de Supabase.
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
GEO_API_URL = "https://geo.api.gouv.fr/departements/86/communes"


def make_slug(name):
    """Génère un slug à partir d'un nom de commune."""
    slug = unicodedata.normalize("NFD", name.lower())
    slug = "".join(c for c in slug if unicodedata.category(c) != "Mn")
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def fetch_cities():
    """Récupère les communes du département 86 via l'API geo."""
    params = {
        "fields": "nom,code,codesPostaux,population,centre",
        "format": "json",
    }
    resp = requests.get(GEO_API_URL, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Récupérer l'id du département 86
    dept = supabase.table("departments").select("id").eq("code", "86").single().execute()
    dept_id = dept.data["id"]

    # Charger les communes
    communes = fetch_cities()
    print(f"Communes récupérées depuis l'API geo : {len(communes)}")

    rows = []
    for commune in communes:
        coords = commune.get("centre", {}).get("coordinates", [None, None])
        postal_codes = commune.get("codesPostaux", [])

        rows.append({
            "department_id": dept_id,
            "name": commune["nom"],
            "slug": make_slug(commune["nom"]),
            "postal_code": postal_codes[0] if postal_codes else None,
            "insee_code": commune["code"],
            "population": commune.get("population"),
            "longitude": coords[0] if coords else None,
            "latitude": coords[1] if coords else None,
        })

    # Insérer par batch
    batch_size = 100
    total = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        supabase.table("cities").insert(batch).execute()
        total += len(batch)
        print(f"  Inséré {total}/{len(rows)} communes...")

    print(f"Terminé : {total} communes insérées pour la Vienne (86).")


if __name__ == "__main__":
    main()
