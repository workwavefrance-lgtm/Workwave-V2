import path from "path"; import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
async function main() {
  const sb = getServiceClient();
  const rows: { metier: string; ville: string; n: number }[] = [];
  let off = 0;
  while (true) {
    const { data, error } = await sb.from("listing_cat_ville").select("metier,ville,n").order("metier").order("ville").range(off, off + 999);
    if (error) { console.log("ERREUR", error.message); break; }
    const r = data || []; if (!r.length) break; rows.push(...(r as any)); off += r.length;
  }
  console.log("combos n>=3 :", rows.length);
  const somme = rows.reduce((a, r) => a + r.n, 0);
  const liens = rows.reduce((a, r) => a + Math.min(10, r.n), 0);
  const p = (f: (n: number) => boolean) => rows.filter((r) => f(r.n)).length;
  console.log(JSON.stringify({
    combos: rows.length,
    pros_couverts: somme,
    liens_pro_emis_page1: liens,
    pct_pros_lies: Math.round((liens / somme) * 1000) / 10,
    combos_sup_10: p((n) => n > 10), combos_sup_20: p((n) => n > 20),
    combos_sup_100: p((n) => n > 100), combos_sup_500: p((n) => n > 500),
    pros_dans_combos_sup_100: rows.filter((r) => r.n > 100).reduce((a, r) => a + r.n, 0),
    max: Math.max(...rows.map((r) => r.n)),
  }));
  fs.writeFileSync("/tmp/listing_dist.json", JSON.stringify(rows));
  console.log("top 10 combos :", rows.slice().sort((a,b)=>b.n-a.n).slice(0,10).map(r=>`${r.metier}/${r.ville}=${r.n}`).join(" "));
}
main().catch((e)=>{console.error(e);process.exit(1);});
