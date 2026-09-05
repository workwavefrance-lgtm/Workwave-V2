import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function pagine(naf: string) {
  const out: any[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await sb
      .from("pros").select("id, siret, category_id, etat_admin, is_active, deleted_at, city_id, postal_code, name")
      .eq("naf_code", naf).like("postal_code", "75%").range(offset, offset + 999);
    if (error) throw new Error(error.message);
    const rows = data || [];
    if (rows.length === 0) break;
    out.push(...rows); offset += rows.length;
  }
  return out;
}

async function main() {
  for (const naf of ["4329B", "4332B", "4322B"]) {
    const rows = await pagine(naf);
    const nulls = rows.filter((r) => !r.siret).length;
    const m = new Map<string, any[]>();
    for (const r of rows) { if (!r.siret) continue; if (!m.has(r.siret)) m.set(r.siret, []); m.get(r.siret)!.push(r); }
    const dups = [...m.entries()].filter(([, v]) => v.length > 1);
    const inactifs = rows.filter((r) => r.is_active === false).length;
    const supprimes = rows.filter((r) => r.deleted_at).length;
    const sansVille = rows.filter((r) => !r.city_id).length;
    console.log(`\nNAF ${naf}: ${rows.length} lignes | siret null ${nulls} | sirets dupliques ${dups.length} | is_active=false ${inactifs} | deleted_at ${supprimes} | city_id null ${sansVille}`);
    if (dups.length) {
      console.log("  exemple dup:", JSON.stringify(dups[0][1].map((x: any) => ({ id: x.id, cat: x.category_id, etat: x.etat_admin, cp: x.postal_code, name: x.name }))));
    }
    // ouverts selon differentes definitions
    const ouvA = rows.filter((r) => r.etat_admin !== "F").length;
    const ouvB = rows.filter((r) => r.etat_admin !== "F" && r.is_active !== false && !r.deleted_at).length;
    console.log(`  etat_admin<>'F': ${ouvA} | + actif&non supprime: ${ouvB}`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
