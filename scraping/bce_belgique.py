"""
Scraping BCE/KBO Open Data — Belgique francophone (Wallonie + Bruxelles).

Source : dump officiel KboOpenData_*_Full.zip telecharge depuis
kbopub.economie.fgov.be/kbo-open-data (compte gratuit, licence acceptee,
finalite declaree "annuaire en ligne"). C'est LE canal legal pour le bulk —
le scraping du site Public Search est INTERDIT (amende jusqu'a 50k EUR).

Obligations licence (art. 2.7, 2.8) : donnees non alterees, source + date de
mise a jour affichees sur les fiches (fait dans /artisan/[slug] pour
source='bce'). INTERDICTION marketing direct vers les personnes physiques
sur base de ces donnees (art. 2.2).

Perimetre : etablissements dont le code postal figure dans
scraping/data/be_postcode_nis.json (639 CP = 271 communes wallonnes
francophones + Bruxelles ; Flandre et communes germanophones EXCLUES).

Modele : 1 fiche par ENTREPRISE (numero BCE 10 chiffres stocke dans
pros.siret, unique — jamais de collision avec un SIRET 14 chiffres),
adresse = son unite d'etablissement en zone (ou son siege pour les
personnes morales). Personne physique sans etablissement = pas d'adresse
publiee par la BCE -> skip (comptabilise).

Usage :
    python3 scraping/bce_belgique.py --zip ~/Downloads/KboOpenData_0140_2026_07_Full.zip --dry-run
    python3 scraping/bce_belgique.py --zip ~/Downloads/KboOpenData_0140_2026_07_Full.zip
    (--limit 500 pour un test partiel)
"""

import argparse
import csv
import glob
import io
import json
import os
import re
import sys
import unicodedata
import zipfile
from collections import defaultdict

from dotenv import load_dotenv
from supabase import create_client

# .env.local du projet (le scraper tourne depuis la racine du repo)
load_dotenv(".env.local")
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

HERE = os.path.dirname(os.path.abspath(__file__))

# ─── Mappings NACE-BEL -> slug categorie Workwave (1 dict PAR VERSION) ─────
# EXPLICITE et restrictif (lecon NAF 18/04 : jamais supposer qu'un code
# generique correspond 1:1 a un metier). Codes trop generiques EXCLUS.
# ⚠️ CRUCIAL : un meme code change de SENS entre versions (43910 = couverture
# en 2008, mais famille rejointoiement en 2025 ; 43410 = couverture en 2025).
# Ne JAMAIS fusionner les deux dicts.
NACE_2008 = {
    # Gros oeuvre / structure
    "41201": "macon",        # construction generale de maisons residentielles
    "41202": "macon",        # construction generale d'autres batiments
    "43994": "macon",        # travaux de maconnerie et de rejointoiement
    "43996": "macon",        # realisation de chapes
    "43110": "terrassier",   # demolition
    "43120": "terrassier",   # preparation des sites
    # Toiture / enveloppe
    "43910": "couvreur",     # travaux de couverture
    "43991": "couvreur",     # travaux d'etancheification
    "43992": "facadier",     # travaux de ravalement des facades
    # Second oeuvre
    "43211": "electricien",  # installation electrotechnique de batiment
    "43212": "electricien",  # installation electrotechnique hors batiment
    "43221": "plombier",     # travaux de plomberie
    "43222": "chauffagiste", # chauffage, ventilation, climatisation (clim reclassee par regex ensuite, comme en France)
    "43291": "plaquiste",    # travaux d'isolation
    "43310": "plaquiste",    # travaux de platrerie
    "43320": "menuisier",    # travaux de menuiserie
    "43331": "carreleur",    # pose de carrelages
    "43332": "menuisier",    # pose de revetements en bois (parquets)
    "43333": "carreleur",    # pose d'autres revetements de sols et murs
    "43341": "peintre",      # peinture de batiments
    "43343": "vitrier",      # travaux de vitrerie
    # Conception / exterieur
    "71111": "architecte",   # activites d'architecture (construction)
    "71113": "paysagiste",   # architecture paysagere / de jardin
    "81300": "paysagiste",   # services d'amenagement paysager
    # Domicile (perimetre volontairement minimal en v1)
    "81210": "menage",       # nettoyage courant des batiments
    "49420": "demenagement", # services de demenagement
}

# NACE-BEL 2025 (codes 5 chiffres, ou 7 chiffres nationaux -> lookup sur les
# 5 premiers). Construit depuis les libelles officiels du dump (code.csv,
# Category=Nace2025, FR) — verifies sur le dump du 11/07/2026.
NACE_2025 = {
    "41001": "macon",        # construction generale de batiments residentiels
    "41002": "macon",        # construction generale de batiments non residentiels
    "43910": "macon",        # travaux de maconnerie et rejointoiement (≠ 2008 !)
    "43110": "terrassier",   # demolition
    "43120": "terrassier",   # preparation des sites
    "43410": "couvreur",     # travaux de couverture (nouveau code 2025)
    "43420": "facadier",     # ravalement / travaux de facade
    "43211": "electricien",  # installation electrotechnique
    "43212": "electricien",  # installation electrotechnique hors batiment
    "43221": "plombier",     # plomberie
    "43222": "chauffagiste", # chauffage, climatisation (clim reclassee ensuite)
    "43230": "plaquiste",    # mise en place de l'isolation (nouveau code 2025)
    "43310": "plaquiste",    # platrerie
    "43320": "menuisier",    # menuiserie
    "43331": "carreleur",    # carrelage
    "43332": "menuisier",    # revetements bois
    "43333": "carreleur",    # autres revetements sols/murs
    "43341": "peintre",      # peinture de batiments
    "43343": "vitrier",      # vitrerie
    "71111": "architecte",   # architecture de construction
    "71113": "paysagiste",   # architecture paysagere
    "81300": "paysagiste",   # amenagement paysager
    "81210": "menage",       # nettoyage courant des batiments
    "49420": "demenagement", # demenagement
}

def map_nace(version, code):
    """Retourne le slug categorie pour (version, code) ou None. Les codes 2025
    nationaux a 7 chiffres sont rattaches a leur classe 5 chiffres."""
    if version == "2008":
        return NACE_2008.get(code)
    if version == "2025":
        return NACE_2025.get(code) or NACE_2025.get(code[:5])
    return None

# Formes juridiques a EXCLURE (entites publiques/parapubliques : communes,
# intercommunales, SA de droit public type Proximus/SNCB, zones de police...).
# Detectees par leur LIBELLE officiel FR dans code.csv (data-driven, pas de
# codes en dur).
PUBLIC_FORM_PATTERN = re.compile(
    r"droit public|publique|commune|communal|province|provincial|intercommunale"
    r"|autorit|minist|f[ée]d[ée]ral|zone de police|zone de secours|r[ée]gie"
    r"|c\.?p\.?a\.?s|centre public|association de projet|pouvoirs? public",
    re.IGNORECASE,
)

# Ceinture supplementaire : noms manifestement publics/parapublics. SEARCH
# (pas match) : "Association Intercommunale...", "IDELUX Eau" passaient avec
# une forme juridique banale. Inclut les grandes intercommunales et societes
# parapubliques wallonnes/bruxelloises connues + les societes de logement
# social (MAIN 41001 -> polluaient "macon").
PUBLIC_NAME_PATTERN = re.compile(
    r"intercommunal|de droit public|zone de police|zone de secours"
    r"|administration communale|service public|centre public|c\.p\.a\.s|\bcpas\b"
    r"|societe nationale|société nationale|societe de developpement|société de développement"
    r"|societe du logement|société du logement|societe wallonne|société wallonne"
    r"|societe regionale|société régionale|port autonome|habitations sociales"
    r"|logement social|\bfoyer\b|\ble logis\b"
    r"|^(ville d|commune d|province d|r[ée]gie|spf )"
    r"|\b(idelux|inasep|igretec|ipalle|ideta|hygea|tibi|vivaqua|sibelga"
    r"|citydev|sofico|swde|stib|sncb|infrabel|ores\b|resa\b)",
    re.IGNORECASE,
)

BATCH_SIZE = 500


def norm_num(n):
    """'0200.065.765' -> '0200065765' (chiffres uniquement)."""
    return re.sub(r"\D", "", n or "")


def make_slug(name):
    slug = unicodedata.normalize("NFD", (name or "").lower())
    slug = "".join(c for c in slug if unicodedata.category(c) != "Mn")
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")[:60] or "pro"


def parse_date_be(d):
    """'22-11-2024' (jj-mm-aaaa) -> ('2024-11-22', 2024) ou (None, None)."""
    m = re.match(r"^(\d{2})-(\d{2})-(\d{4})$", d or "")
    if not m:
        return None, None
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}", int(m.group(3))


def open_csv(zf, name):
    """Stream un CSV du zip en DictReader (UTF-8, separateur virgule)."""
    return csv.DictReader(io.TextIOWrapper(zf.open(name), encoding="utf-8-sig"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zip", help="chemin du KboOpenData_*_Full.zip (defaut : le plus recent de ~/Downloads)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="limiter le nb de fiches (test)")
    args = ap.parse_args()

    zip_path = args.zip
    if not zip_path:
        candidates = sorted(glob.glob(os.path.expanduser("~/Downloads/KboOpenData_*Full*.zip")))
        if not candidates:
            print("Aucun KboOpenData_*Full*.zip dans ~/Downloads. --zip <chemin> requis.")
            sys.exit(1)
        zip_path = candidates[-1]
    zip_path = os.path.expanduser(zip_path)
    print(f"Dump : {zip_path} ({os.path.getsize(zip_path)/1e6:.0f} Mo)")

    # Date d'extraction (pour l'attribution licence art. 2.8) : depuis le nom
    # du fichier KboOpenData_0140_2026_07_Full.zip -> 2026-07.
    m = re.search(r"(\d{4})_(\d{2})", os.path.basename(zip_path))
    extract_date = f"{m.group(1)}-{m.group(2)}" if m else "inconnue"
    print(f"Millesime du dump : {extract_date}")

    # ── Zone : CP belges francophones -> NIS ──
    with open(os.path.join(HERE, "data", "be_postcode_nis.json")) as f:
        cp_to_nis = json.load(f)
    print(f"Zone : {len(cp_to_nis)} codes postaux (Wallonie FR + Bruxelles)")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # ── Categories par slug (jamais d'ID hardcode — lecon 26/05) ──
    slugs_needed = sorted(set(NACE_2008.values()) | set(NACE_2025.values()))
    cats = supabase.table("categories").select("id, slug").in_("slug", slugs_needed).execute()
    cat_id_by_slug = {c["slug"]: c["id"] for c in (cats.data or [])}
    missing = [s for s in slugs_needed if s not in cat_id_by_slug]
    if missing:
        print(f"🔴 categories introuvables en base : {missing}")
        sys.exit(1)
    print(f"Categories mappees : {len(cat_id_by_slug)}")

    # ── Communes BE : NIS -> city_id (country='BE' UNIQUEMENT, collision INSEE) ──
    city_by_nis = {}
    offset = 0
    while True:
        res = supabase.table("cities").select("id, insee_code").eq("country", "BE").range(offset, offset + 999).execute()
        rows = res.data or []
        if not rows:
            break
        for c in rows:
            if c["insee_code"]:
                city_by_nis[c["insee_code"]] = c["id"]
        offset += len(rows)
    print(f"Communes BE en base : {len(city_by_nis)}")

    zf = zipfile.ZipFile(zip_path)
    names = {os.path.basename(n): n for n in zf.namelist()}
    for required in ["address.csv", "enterprise.csv", "establishment.csv", "denomination.csv", "activity.csv", "contact.csv"]:
        if required not in names:
            print(f"🔴 {required} absent du zip ({sorted(names)})")
            sys.exit(1)

    # ── Passe 1 : adresses en zone ──
    # entity -> (zipcode, rue) ; entites = sieges (n° 0/1...) ET etablissements (2...).
    print("\n[1/6] address.csv — filtrage zone…")
    addr = {}
    scanned = 0
    for row in open_csv(zf, names["address.csv"]):
        scanned += 1
        if row.get("DateStrikingOff"):
            continue  # adresse radiee
        zc = (row.get("Zipcode") or "").strip()
        if zc not in cp_to_nis:
            continue
        entity = norm_num(row.get("EntityNumber"))
        street = (row.get("StreetFR") or row.get("StreetNL") or "").strip()
        num = (row.get("HouseNumber") or "").strip()
        box = (row.get("Box") or "").strip()
        parts = " ".join(p for p in [street, num] if p)
        if box:
            parts = f"{parts} boite {box}" if parts else f"boite {box}"
        addr[entity] = (zc, parts or None)
    print(f"  {scanned} adresses scannees -> {len(addr)} entites en zone")

    # ── Passe 2 : etablissements -> entreprise ──
    print("[2/6] establishment.csv…")
    estab_to_ent = {}
    for row in open_csv(zf, names["establishment.csv"]):
        est = norm_num(row.get("EstablishmentNumber"))
        if est in addr:
            estab_to_ent[est] = norm_num(row.get("EnterpriseNumber"))
    print(f"  {len(estab_to_ent)} etablissements en zone")

    # Entreprises candidates : siege en zone OU >=1 etablissement en zone.
    ent_candidates = set(estab_to_ent.values())
    for e in addr:
        if e and e[0] in ("0", "1"):
            ent_candidates.add(e)
    print(f"  {len(ent_candidates)} entreprises candidates")

    # ── Passe 3 : entreprises (type, date creation) ──
    print("[3/6] enterprise.csv…")
    # Formes juridiques publiques (exclusion) : depuis les libelles code.csv
    public_forms = set()
    for row in open_csv(zf, names["code.csv"]):
        if row.get("Category") == "JuridicalForm" and row.get("Language") == "FR":
            if PUBLIC_FORM_PATTERN.search(row.get("Description") or ""):
                public_forms.add((row.get("Code") or "").strip())
    print(f"  formes juridiques publiques exclues : {len(public_forms)} codes")

    ent_info = {}
    excluded_public = 0
    for row in open_csv(zf, names["enterprise.csv"]):
        ent = norm_num(row.get("EnterpriseNumber"))
        if ent in ent_candidates:
            jf = (row.get("JuridicalForm") or "").strip()
            if jf in public_forms:
                excluded_public += 1
                continue
            ent_info[ent] = {
                "type": (row.get("TypeOfEnterprise") or "").strip(),  # 1=personne physique, 2=morale
                "start": (row.get("StartDate") or "").strip(),
            }
    print(f"  {len(ent_info)} entreprises retenues ({excluded_public} publiques exclues)")

    # ── Passe 4 : activites NACE (version 2008, MAIN puis SECO) ──
    print("[4/6] activity.csv…")
    # MAIN UNIQUEMENT : matcher les activites secondaires ferait entrer les
    # geants dont un code construction est annexe (Proximus 43211, SNCB...).
    # Le scraper SIRENE francais filtre pareil (activitePrincipale).
    ent_slugs = defaultdict(list)   # ent -> [slug categorie] (ordre d'apparition)
    ent_first_code = {}             # ent -> premier code NACE mappe (colonne naf_code)
    for row in open_csv(zf, names["activity.csv"]):
        if (row.get("Classification") or "").strip().upper() != "MAIN":
            continue
        entity = norm_num(row.get("EntityNumber"))
        ent = estab_to_ent.get(entity, entity)
        if ent not in ent_info:
            continue
        slug = map_nace((row.get("NaceVersion") or "").strip(), (row.get("NaceCode") or "").strip())
        if not slug:
            continue
        if slug not in ent_slugs[ent]:
            ent_slugs[ent].append(slug)
        ent_first_code.setdefault(ent, (row.get("NaceCode") or "").strip())
    matched_ents = set(ent_slugs)
    print(f"  {len(matched_ents)} entreprises avec un metier Workwave en activite PRINCIPALE (2008+2025)")

    # ── Passe 5 : denominations (prefere FR=1 puis NL=2 ; sociale 001 puis commerciale 003) ──
    print("[5/6] denomination.csv…")
    names_by_ent = {}
    def name_score(lang, typ):
        lang_score = {"1": 0, "0": 1, "2": 2, "3": 3, "4": 4}.get(lang, 5)
        typ_score = {"001": 0, "003": 1, "002": 2}.get(typ, 3)
        return (typ_score, lang_score)
    for row in open_csv(zf, names["denomination.csv"]):
        entity = norm_num(row.get("EntityNumber"))
        ent = estab_to_ent.get(entity, entity)
        if ent not in matched_ents:
            continue
        denom = (row.get("Denomination") or "").strip()
        if not denom:
            continue
        score = name_score((row.get("Language") or "").strip(), (row.get("TypeOfDenomination") or "").strip())
        if ent not in names_by_ent or score < names_by_ent[ent][0]:
            names_by_ent[ent] = (score, denom)
    print(f"  {len(names_by_ent)} denominations")

    # ── Passe 6 : contacts (tel/email/web publies au registre) ──
    print("[6/6] contact.csv…")
    contacts = defaultdict(dict)
    for row in open_csv(zf, names["contact.csv"]):
        entity = norm_num(row.get("EntityNumber"))
        ent = estab_to_ent.get(entity, entity)
        if ent not in matched_ents:
            continue
        ctype = (row.get("ContactType") or "").strip().upper()
        val = (row.get("Value") or "").strip()
        if val and ctype in ("TEL", "EMAIL", "WEB") and ctype not in contacts[ent]:
            contacts[ent][ctype] = val[:200]
    print(f"  {sum(len(v) for v in contacts.values())} contacts sur {len(contacts)} entreprises")

    # ── Composition des fiches ──
    print("\nComposition des fiches…")
    # adresse retenue : etablissement en zone (prioritaire), sinon siege en zone.
    ent_addr = {}
    for est, ent in estab_to_ent.items():
        if ent in matched_ents and ent not in ent_addr:
            ent_addr[ent] = addr[est]
    for ent in matched_ents:
        if ent not in ent_addr and ent in addr:
            ent_addr[ent] = addr[ent]

    rows, skipped_no_addr, skipped_no_name, skipped_no_city = [], 0, 0, 0
    for ent in sorted(matched_ents):
        a = ent_addr.get(ent)
        if not a:
            skipped_no_addr += 1  # personne physique sans etablissement (pas d'adresse publiee)
            continue
        zc, street = a
        name_entry = names_by_ent.get(ent)
        if not name_entry:
            skipped_no_name += 1
            continue
        city_id = city_by_nis.get(cp_to_nis.get(zc, ""))
        if not city_id:
            skipped_no_city += 1
            continue
        if PUBLIC_NAME_PATTERN.search(name_entry[1]):
            skipped_no_name += 1  # entite publique par le nom (ceinture)
            continue
        cat_slugs = ent_slugs[ent]
        founding_date, founded_year = parse_date_be(ent_info[ent]["start"])
        c = contacts.get(ent, {})
        rows.append({
            "slug": f"{make_slug(name_entry[1])}-{ent[-5:]}",
            "name": name_entry[1][:150],
            "siret": ent,           # numero BCE 10 chiffres
            "siren": None,          # notion francaise — jamais tronquer le BCE
            "category_id": cat_id_by_slug[cat_slugs[0]],
            "secondary_category_ids": [cat_id_by_slug[s] for s in cat_slugs[1:4]] or None,
            "address": street,
            "city_id": city_id,
            "postal_code": zc,
            "phone": c.get("TEL"),
            "email": c.get("EMAIL"),
            "website": c.get("WEB"),
            "naf_code": ent_first_code.get(ent),
            "founding_date": founding_date,
            "founded_year": founded_year,
            "source": "bce",
        })
        if args.limit and len(rows) >= args.limit:
            break

    print(f"  fiches composees : {len(rows)}")
    print(f"  skip sans adresse (pers. physiques sans etablissement) : {skipped_no_addr}")
    print(f"  skip sans nom : {skipped_no_name} · skip commune inconnue : {skipped_no_city}")

    # Dedup slugs (pattern sirene)
    seen = set()
    for r in rows:
        while r["slug"] in seen:
            r["slug"] += "b"
        seen.add(r["slug"])

    # Stats par categorie
    from collections import Counter
    by_cat = Counter(r["category_id"] for r in rows)
    slug_by_id = {v: k for k, v in cat_id_by_slug.items()}
    for cid, n in by_cat.most_common():
        print(f"    {slug_by_id[cid]:<15} {n}")

    if args.dry_run:
        print("\n[DRY-RUN] aucun insert. Echantillon :")
        for r in rows[len(rows)//2 : len(rows)//2 + 5] + rows[:2]:
            print("   ", json.dumps({k: r[k] for k in ('slug','name','siret','postal_code','naf_code','phone','email')}, ensure_ascii=False))
        return

    # ── Upsert par batch ──
    print(f"\nUpsert {len(rows)} fiches (batch {BATCH_SIZE}, on_conflict=siret, ignore_duplicates)…")
    sent = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        try:
            supabase.table("pros").upsert(batch, on_conflict="siret", ignore_duplicates=True).execute()
        except Exception as e:
            print(f"  batch {i}: erreur ({e}), fallback unitaire…")
            for r in batch:
                try:
                    supabase.table("pros").upsert([r], on_conflict="siret", ignore_duplicates=True).execute()
                except Exception as e2:
                    print(f"    KO {r['siret']} {r['slug']}: {e2}")
        sent += len(batch)
        if sent % 5000 < BATCH_SIZE:
            print(f"  {sent}/{len(rows)}")

    # ── Verite en base (lecon 18/04 : jamais se fier au count envoye) ──
    res = supabase.table("pros").select("id", count="exact").eq("source", "bce").execute()
    print(f"\n✓ Envoyes : {sent}. NET en base (source='bce') : {res.count}")
    print(f"Millesime a afficher sur les fiches : donnees BCE {extract_date}")


if __name__ == "__main__":
    main()
