import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function keyset(naf: string) {
  const out: any[] = [];
  let last = 0;
  while (true) {
    let data: any[] | null = null;
    for (let essai = 0; essai < 4; essai++) {
      const r = await sb.from("pros")
        .select("id, siret, category_id, etat_admin, is_active, deleted_at")
        .eq("naf_code", naf).like("postal_code", "75%")
        .gt("id", last).order("id", { ascending: true }).limit(500);
      if (!r.error) { data = r.data || []; break; }
      if (essai === 3) throw new Error(`${naf} apres id ${last}: ${r.error.message}`);
      await new Promise((res) => setTimeout(res, 3000 * (essai + 1)));
    }
    const rows = data!;
    if (rows.length === 0) break;
    out.push(...rows);
    last = rows[rows.length - 1].id;
  }
  return out;
}

async function main() {
  for (const naf of ["4329B", "4332B", "4322B"]) {
    const rows = await keyset(naf);
    const ids = new Set(rows.map((r) => r.id));
    const sirets = new Set(rows.map((r) => r.siret));
    const parCat = new Map<number, { tot: number; ouvStricts: number }>();
    for (const r of rows) {
      if (!parCat.has(r.category_id)) parCat.set(r.category_id, { tot: 0, ouvStricts: 0 });
      const e = parCat.get(r.category_id)!;
      e.tot++;
      if (r.etat_admin !== "F" && r.is_active !== false && !r.deleted_at) e.ouvStricts++;
    }
    console.log(`\nNAF ${naf} Paris : ${rows.length} lignes (ids distincts ${ids.size}, sirets distincts ${sirets.size})`);
    for (const [cat, e] of [...parCat.entries()].sort((a, b) => b[1].tot - a[1].tot)) {
      console.log(`  cat ${cat} : total ${e.tot} | visibles (ouvert+actif) ${e.ouvStricts}`);
    }
    const tot = rows.filter((r) => r.etat_admin !== "F" && r.is_active !== false && !r.deleted_at).length;
    console.log(`  TOTAL visibles : ${tot}`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
