import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function keyset(naf: string, cats: number[]) {
  const out: any[] = [];
  let last = 0;
  while (true) {
    let data: any[] | null = null;
    for (let essai = 0; essai < 4; essai++) {
      const r = await sb.from("pros")
        .select("id, siret, category_id, etat_admin, is_active, deleted_at, postal_code")
        .eq("city_id", 12133).eq("naf_code", naf).in("category_id", cats)
        .gt("id", last).order("id", { ascending: true }).limit(500);
      if (!r.error) { data = r.data || []; break; }
      if (essai === 3) throw new Error(`${naf} apres id ${last}: ${r.error.message}`);
      await new Promise((res) => setTimeout(res, 4000 * (essai + 1)));
    }
    const rows = data!;
    if (rows.length === 0) break;
    out.push(...rows);
    last = rows[rows.length - 1].id;
  }
  return out;
}

async function main() {
  const plan: [string, number[]][] = [
    ["4329B", [36, 199]],
    ["4332B", [5, 11, 37]],
    ["4322B", [12, 13, 38]],
  ];
  for (const [naf, cats] of plan) {
    const rows = await keyset(naf, cats);
    const ids = new Set(rows.map((r) => r.id));
    const parCat = new Map<number, { tot: number; vis: number }>();
    for (const c of cats) parCat.set(c, { tot: 0, vis: 0 });
    for (const r of rows) {
      const e = parCat.get(r.category_id)!;
      e.tot++;
      if (r.etat_admin !== "F" && r.is_active !== false && !r.deleted_at) e.vis++;
    }
    console.log(`\nNAF ${naf} — city_id 12133 (Paris) : ${rows.length} lignes, ids distincts ${ids.size}`);
    for (const [cat, e] of parCat) console.log(`  cat ${cat} : total ${e.tot} | visibles ${e.vis}`);
    console.log(`  TOTAL visibles : ${rows.filter((r) => r.etat_admin !== "F" && r.is_active !== false && !r.deleted_at).length}`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
