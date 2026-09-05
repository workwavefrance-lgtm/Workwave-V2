import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const NAFS = ["4329B", "4332B", "4322B"];

async function pagine(naf: string) {
  const out: any[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await sb
      .from("pros")
      .select("id, siret, category_id, naf_code, etat_admin, deleted_at, is_active, postal_code")
      .eq("naf_code", naf)
      .like("postal_code", "75%")
      .range(offset, offset + 999);
    if (error) throw new Error(`${naf} offset ${offset}: ${error.message}`);
    const rows = data || [];
    if (rows.length === 0) break;
    out.push(...rows);
    offset += rows.length;
  }
  return out;
}

async function main() {
  for (const naf of NAFS) {
    const rows = await pagine(naf);
    const parCat = new Map<number, { tot: number; ouv: number; ferm: number; nul: number }>();
    for (const r of rows) {
      const k = r.category_id;
      if (!parCat.has(k)) parCat.set(k, { tot: 0, ouv: 0, ferm: 0, nul: 0 });
      const e = parCat.get(k)!;
      e.tot++;
      if (r.etat_admin === "F") e.ferm++;
      else if (r.etat_admin === null) e.nul++;
      else e.ouv++;
    }
    console.log(`\n=== NAF ${naf} — Paris (postal_code 75xxx) — ${rows.length} lignes en base`);
    for (const [cat, e] of [...parCat.entries()].sort((a, b) => b[1].tot - a[1].tot)) {
      console.log(`  cat ${cat}: total ${e.tot} | ouverts ${e.ouv} | fermes ${e.ferm} | etat null ${e.nul}`);
    }
    const sirets = new Set(rows.map((r) => r.siret));
    console.log(`  SIRET distincts: ${sirets.size}`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
