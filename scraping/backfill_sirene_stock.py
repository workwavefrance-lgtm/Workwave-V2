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
STOCK_URL = "https://files.data.gouv.fr/insee-sirene/StockEtablissement_utf8.zip"
ZIP_PATH = "/tmp/StockEtablissement_utf8.zip"
CHUNK = 500


def load_target_sirets():
    """SIRETs des pros actifs sans founded_year. Pattern pagination 09/05."""
    sirets = set()
    offset = 0
    t0 = time.time()
    while True:
        res = (
            SB.table("pros")
            .select("siret")
            .eq("is_active", True)
            .is_("deleted_at", "null")
            .is_("founded_year", "null")
            .not_.is_("siret", "null")
            .range(offset, offset + 999)
            .execute()
        )
        rows = res.data or []
        if not rows:
            break
        for r in rows:
            s = (r.get("siret") or "").strip()
            if len(s) == 14:
                sirets.add(s)
        offset += len(rows)
        if offset % 100000 == 0:
            print(f"  ... {offset} sirets charges ({int(time.time()-t0)}s)", flush=True)
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
    """Upsert un chunk — verifie l'error de CHAQUE appel (lecon 08/06)."""
    if not batch:
        return
    try:
        SB.table("pros").upsert(batch, on_conflict="siret").execute()
        stats["updated"] += len(batch)
    except Exception as e:  # noqa: BLE001
        stats["errors"] += 1
        print(f"  !! upsert KO ({len(batch)} rows) : {str(e)[:150]}", flush=True)


def main():
    sirets = load_target_sirets()
    if not sirets:
        print("Rien a backfiller.")
        return
    download_stock()

    print("Streaming du stock (unzip -p | csv)...", flush=True)
    proc = subprocess.Popen(["unzip", "-p", ZIP_PATH], stdout=subprocess.PIPE)
    reader = csv.reader(io.TextIOWrapper(proc.stdout, encoding="utf-8", errors="replace"))
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
    proc.wait()
    print(f"\nTERMINE : {stats['scanned']} lignes scannees, {stats['matched']} matches, "
          f"{stats['updated']} pros mis a jour, {stats['errors']} chunks en erreur, "
          f"{int(time.time()-t0)}s", flush=True)


if __name__ == "__main__":
    main()
