#!/usr/bin/env python3
"""
Backfill ancienneté + effectif depuis le STOCK SIRENE complet (open data INSEE).

Cible : tous les pros actifs avec founded_year IS NULL (~2,29M dont les 657k
du scrape DP). L'API recherche-entreprises serait trop lente à cette échelle
(>5 jours) → on streame le fichier stock officiel (2,6 Go zip, ~40M lignes)
et on matche par SIRET en local.

Champs écrits (UPDATE via upsert on_conflict=siret, colonnes fournies only) :
  - founding_date  (dateCreationEtablissement, ISO)
  - founded_year   (dérivé)
  - effectif_range (trancheEffectifsEtablissement, code brut SIRENE ex "11")

Usage :
  nohup caffeinate -i python3 scraping/backfill_sirene_stock.py \
    > scraping/backfill_stock.log 2>&1 &

Idempotent : relançable, le set "founded_year IS NULL" rétrécit à chaque run.
Leçons appliquées : pagination rows.length==0 (09/05), vérif error de CHAQUE
upsert (08/06), job long détaché caffeinate (31/05).
"""
import csv
import io
import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv  # noqa: E402

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"), override=True)
from supabase import create_client  # noqa: E402

SB = create_client(os.environ["NEXT_PUBLIC_SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
STOCK_URL = "https://static.data.gouv.fr/resources/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/20260601-092359/stock-stocketablissement-csv.zip"
ZIP_PATH = "/tmp/StockEtablissement_utf8.zip"
CHUNK = 500


def load_target_sirets():
    """SIRETs des pros actifs sans founded_year. Pattern pagination 09/05."""
    # Pagination par CURSEUR sur id (lecon 26/05 : OFFSET profond sur table
    # filtree 2,4M rows = scan lent -> statement timeout). WHERE id > last
    # ORDER BY id = range scan d'index, constant quel que soit l'avancement.
    sirets = set()
    last_id = 0
    loaded = 0
    t0 = time.time()
    while True:
        res = (
            SB.table("pros")
            .select("id, siret")
            .eq("is_active", True)
            .is_("deleted_at", "null")
            .is_("founded_year", "null")
            .not_.is_("siret", "null")
            .gt("id", last_id)
            .order("id")
            .limit(1000)
            .execute()
        )
        rows = res.data or []
        if not rows:
            break
        last_id = rows[-1]["id"]
        loaded += len(rows)
        for r in rows:
            s = (r.get("siret") or "").strip()
            if len(s) == 14:
                sirets.add(s)
        if loaded % 100000 < 1000:
            print(f"  ... {loaded} sirets charges ({int(time.time()-t0)}s)", flush=True)
    print(f"SIRETs cibles : {len(sirets)} ({int(time.time()-t0)}s)", flush=True)
    return sirets


def download_stock():
    if os.path.exists(ZIP_PATH) and os.path.getsize(ZIP_PATH) > 2_000_000_000:
        print(f"Zip deja present ({os.path.getsize(ZIP_PATH)//1_000_000} Mo), skip download", flush=True)
        return
    print(f"Telechargement {STOCK_URL} ...", flush=True)
    subprocess.run(["curl", "-L", "-C", "-", "-o", ZIP_PATH, STOCK_URL], check=True)
    print(f"Telecharge : {os.path.getsize(ZIP_PATH)//1_000_000} Mo", flush=True)


def flush(batch, stats):
    """Bulk UPDATE via RPC backfill_pro_founding (pas d'upsert : slug NOT NULL
    ferait echouer l'INSERT — bug 12/06). Verifie l'error de CHAQUE appel
    (lecon 08/06). La RPC retourne le nombre de lignes REELLEMENT modifiees."""
    if not batch:
        return
    try:
        res = SB.rpc("backfill_pro_founding", {"items": batch}).execute()
        stats["updated"] += res.data if isinstance(res.data, int) else len(batch)
    except Exception as e:  # noqa: BLE001
        stats["errors"] += 1
        print(f"  !! rpc KO ({len(batch)} rows) : {str(e)[:150]}", flush=True)


def main():
    sirets = load_target_sirets()
    if not sirets:
        print("Rien a backfiller.")
        return
    download_stock()

    # zipfile (zip64 natif) : l'unzip de macOS renvoie un flux VIDE sur ce
    # zip64 de 12 Go decompresses -> StopIteration sur le header (bug 12/06).
    import zipfile
    print("Streaming du stock (zipfile zip64)...", flush=True)
    zf = zipfile.ZipFile(ZIP_PATH)
    inner = zf.namelist()[0]
    reader = csv.reader(io.TextIOWrapper(zf.open(inner), encoding="utf-8", errors="replace"))
    header = next(reader)
    idx = {name: i for i, name in enumerate(header)}
    i_siret = idx["siret"]
    i_date = idx["dateCreationEtablissement"]
    i_eff = idx["trancheEffectifsEtablissement"]

    stats = {"scanned": 0, "matched": 0, "updated": 0, "errors": 0}
    batch, seen = [], set()
    t0 = time.time()
    for row in reader:
        stats["scanned"] += 1
        if stats["scanned"] % 5_000_000 == 0:
            print(f"  ... {stats['scanned']//1_000_000}M lignes, {stats['matched']} matches, "
                  f"{stats['updated']} maj ({int(time.time()-t0)}s)", flush=True)
        try:
            siret = row[i_siret]
        except IndexError:
            continue
        if siret not in sirets or siret in seen:
            continue
        seen.add(siret)
        date_c = row[i_date].strip() if len(row) > i_date else ""
        eff = row[i_eff].strip() if len(row) > i_eff else ""
        if not date_c or len(date_c) < 4:
            continue
        stats["matched"] += 1
        rec = {"siret": siret, "founding_date": date_c, "founded_year": int(date_c[:4])}
        if eff:
            rec["effectif_range"] = eff
        batch.append(rec)
        if len(batch) >= CHUNK:
            flush(batch, stats)
            batch = []
    flush(batch, stats)
    print(f"\nTERMINE : {stats['scanned']} lignes scannees, {stats['matched']} matches, "
          f"{stats['updated']} pros mis a jour, {stats['errors']} chunks en erreur, "
          f"{int(time.time()-t0)}s", flush=True)


if __name__ == "__main__":
    main()
