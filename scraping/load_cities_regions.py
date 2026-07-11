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

# (code, nom, région) — 59 NOUVEAUX départements (métropole restante + DOM).
# Les 40 déjà chargés (Nouvelle-Aquitaine, Bretagne, Pays de la Loire,
# Occitanie, PACA) ne sont PAS ici : idempotent de toute façon, mais inutile
# de re-fetcher l'API geo pour eux.
# ⚠️ CORSE (2A/2B) volontairement EXCLUE de ce lot : code dépt alphanumérique
#    incompatible avec la regex slug département `\d{2,3}` → traitée à part
#    après le fix (sinon pages dépt Corse cassées).
DEPARTMENTS = [
    # Île-de-France
    ("75", "Paris", "Île-de-France"), ("77", "Seine-et-Marne", "Île-de-France"),
    ("78", "Yvelines", "Île-de-France"), ("91", "Essonne", "Île-de-France"),
    ("92", "Hauts-de-Seine", "Île-de-France"), ("93", "Seine-Saint-Denis", "Île-de-France"),
    ("94", "Val-de-Marne", "Île-de-France"), ("95", "Val-d'Oise", "Île-de-France"),
    # Auvergne-Rhône-Alpes
    ("01", "Ain", "Auvergne-Rhône-Alpes"), ("03", "Allier", "Auvergne-Rhône-Alpes"),
    ("07", "Ardèche", "Auvergne-Rhône-Alpes"), ("15", "Cantal", "Auvergne-Rhône-Alpes"),
    ("26", "Drôme", "Auvergne-Rhône-Alpes"), ("38", "Isère", "Auvergne-Rhône-Alpes"),
    ("42", "Loire", "Auvergne-Rhône-Alpes"), ("43", "Haute-Loire", "Auvergne-Rhône-Alpes"),
    ("63", "Puy-de-Dôme", "Auvergne-Rhône-Alpes"), ("69", "Rhône", "Auvergne-Rhône-Alpes"),
    ("73", "Savoie", "Auvergne-Rhône-Alpes"), ("74", "Haute-Savoie", "Auvergne-Rhône-Alpes"),
    # Hauts-de-France
    ("02", "Aisne", "Hauts-de-France"), ("59", "Nord", "Hauts-de-France"),
    ("60", "Oise", "Hauts-de-France"), ("62", "Pas-de-Calais", "Hauts-de-France"),
    ("80", "Somme", "Hauts-de-France"),
    # Grand Est
    ("08", "Ardennes", "Grand Est"), ("10", "Aube", "Grand Est"),
    ("51", "Marne", "Grand Est"), ("52", "Haute-Marne", "Grand Est"),
    ("54", "Meurthe-et-Moselle", "Grand Est"), ("55", "Meuse", "Grand Est"),
    ("57", "Moselle", "Grand Est"), ("67", "Bas-Rhin", "Grand Est"),
    ("68", "Haut-Rhin", "Grand Est"), ("88", "Vosges", "Grand Est"),
    # Normandie
    ("14", "Calvados", "Normandie"), ("27", "Eure", "Normandie"),
    ("50", "Manche", "Normandie"), ("61", "Orne", "Normandie"),
    ("76", "Seine-Maritime", "Normandie"),
    # Bourgogne-Franche-Comté
    ("21", "Côte-d'Or", "Bourgogne-Franche-Comté"), ("25", "Doubs", "Bourgogne-Franche-Comté"),
    ("39", "Jura", "Bourgogne-Franche-Comté"), ("58", "Nièvre", "Bourgogne-Franche-Comté"),
    ("70", "Haute-Saône", "Bourgogne-Franche-Comté"), ("71", "Saône-et-Loire", "Bourgogne-Franche-Comté"),
    ("89", "Yonne", "Bourgogne-Franche-Comté"), ("90", "Territoire de Belfort", "Bourgogne-Franche-Comté"),
    # Centre-Val de Loire
    ("18", "Cher", "Centre-Val de Loire"), ("28", "Eure-et-Loir", "Centre-Val de Loire"),
    ("36", "Indre", "Centre-Val de Loire"), ("37", "Indre-et-Loire", "Centre-Val de Loire"),
    ("41", "Loir-et-Cher", "Centre-Val de Loire"), ("45", "Loiret", "Centre-Val de Loire"),
    # DOM (départements d'outre-mer — codes 3 chiffres, regex `\d{2,3}` OK)
    ("971", "Guadeloupe", "Guadeloupe"), ("972", "Martinique", "Martinique"),
    ("973", "Guyane", "Guyane"), ("974", "La Réunion", "La Réunion"),
    ("976", "Mayotte", "Mayotte"),
    # Corse — codes alphanumériques 2A/2B (regex slug dépt fixée pour les
    # accepter : lib/utils/slugs.ts + lib/queries/departments.ts).
    ("2A", "Corse-du-Sud", "Corse"), ("2B", "Haute-Corse", "Corse"),
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
    """Charge tous les slugs + insee_codes existants (pagination 1000).

    slugs : TOUS pays confondus (l'anti-collision de slug doit voir les villes
    belges, ex. mons-be). insee : FRANCE UNIQUEMENT — les codes NIS belges
    (5 chiffres) chevauchent les INSEE francais (ex. 21004), sans le filtre
    l'idempotence croirait qu'une commune francaise existe deja et la skipperait.
    """
    slugs, insee = set(), set()
    offset = 0
    while True:
        res = sb.table("cities").select("slug, insee_code, country").range(offset, offset + 999).execute()
        rows = res.data or []
        if not rows:
            break
        for r in rows:
            if r.get("slug"):
                slugs.add(r["slug"])
            if r.get("insee_code") and (r.get("country") or "FR") == "FR":
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
                slug = f"{base}-{code.lower()}"  # collision -> suffixe dépt (minuscule : Corse 2a/2b propres)
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

    print(f"\nTERMINÉ : {grand_total} communes ajoutées sur {len(DEPARTMENTS)} départements.")


if __name__ == "__main__":
    main()
