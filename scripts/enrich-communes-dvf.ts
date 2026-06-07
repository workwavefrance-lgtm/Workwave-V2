/**
 * Enrichit la table `commune_data` avec les prix immobiliers RÉELS par commune
 * (DVF 2024, data.gouv.fr, Licence Ouverte — dataset 63dd1cc420bf925d5d1d8b1e).
 *
 * Source : 1 CSV de 29 832 communes (INSEE_COM, Prixm2Moyen, PrixMoyen,
 * nb_mutations, SurfaceMoy, PropMaison, annee). Aucune donnée inventée.
 *
 * Prérequis : migration migrations/2026-06-07_commune_data.sql appliquée.
 * Usage :
 *   npx tsx scripts/enrich-communes-dvf.ts --dry-run   (preview, 0 écriture)
 *   npx tsx scripts/enrich-communes-dvf.ts             (upsert réel)
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry-run");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const CSV_URL =
  "https://static.data.gouv.fr/resources/indicateurs-immobiliers-par-commune-et-par-annee-prix-et-volumes-sur-la-periode-2014-2024/20250707-085855/communesdvf2024.csv";

function toInt(v: string): number | null {
  if (v == null || v === "") return null;
  const n = Math.round(Number(v.replace(",", ".")));
  return Number.isFinite(n) ? n : null;
}

async function main() {
  console.log(`Enrichissement DVF prix immobilier${DRY ? " (DRY-RUN)" : ""}\n`);
  console.log("Téléchargement du CSV DVF 2024…");
  const res = await fetch(CSV_URL);
  if (!res.ok) { console.error("✗ Téléchargement échoué:", res.status); process.exit(1); }
  const text = await res.text();
  const lines = text.trim().split("\n");
  const header = lines[0].split(",");
  const idx = (name: string) => header.indexOf(name);
  const iInsee = idx("INSEE_COM"), iAnnee = idx("annee"), iNbMut = idx("nb_mutations"),
    iPropM = idx("PropMaison"), iPrix = idx("PrixMoyen"), iPrixM2 = idx("Prixm2Moyen"), iSurf = idx("SurfaceMoy");
  if ([iInsee, iPrixM2].some((x) => x < 0)) { console.error("✗ Colonnes attendues absentes"); process.exit(1); }
  console.log(`  ${lines.length - 1} lignes communes\n`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(",");
    const insee = (c[iInsee] || "").trim();
    if (!insee) continue;
    const prixM2 = toInt(c[iPrixM2]);
    // On ne garde la commune que si elle a au moins un prix au m² (sinon row vide inutile)
    if (prixM2 == null) continue;
    rows.push({
      insee_code: insee,
      prix_m2_moyen: prixM2,
      prix_moyen_bien: toInt(c[iPrix]),
      nb_mutations: toInt(c[iNbMut]),
      surface_moy: toInt(c[iSurf]),
      prop_maison: toInt(c[iPropM]),
      dvf_annee: toInt(c[iAnnee]),
      source: "data.gouv.fr (DVF)",
      updated_at: new Date().toISOString(),
    });
  }
  console.log(`Communes avec prix m² exploitable : ${rows.length}`);
  console.log("Échantillon :", JSON.stringify(rows.slice(0, 3), null, 1).slice(0, 500));

  if (DRY) { console.log("\n(DRY — aucune écriture)"); return; }

  // Upsert par lots de 500 (on conflict insee_code)
  let done = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await sb.from("commune_data").upsert(batch, { onConflict: "insee_code" });
    if (error) { console.error(`✗ batch ${i}: ${error.message}`); process.exit(1); }
    done += batch.length;
    if (done % 5000 < 500) console.log(`  … ${done}/${rows.length}`);
  }
  console.log(`\n✓ ${done} communes enrichies (prix immobilier DVF 2024).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
