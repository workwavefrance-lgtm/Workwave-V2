import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  // toutes les villes
  const ids: number[] = []; let off = 0;
  while (true) {
    const { data, error } = await sb.from("cities").select("id").order("id").range(off, off + 999);
    if (error) throw new Error(error.message);
    const rows = data || []; if (rows.length === 0) break;
    ids.push(...rows.map((r: any) => r.id)); off += rows.length;
  }
  console.log("villes en base:", ids.length);
  // categories BTP/domicile/personne
  const { data: cats } = await sb.from("categories").select("id,vertical,slug").in("vertical", ["btp","domicile","personne"]);
  const btpIds = new Set((cats||[]).map((c:any)=>c.id));
  console.log("categories btp/domicile/personne:", btpIds.size);

  let combos3 = 0, villesCouvertes = new Set<number>(), batches = 0;
  const B = 4000;
  for (let i = 0; i < ids.length; i += B) {
    const slice = ids.slice(i, i + B);
    const { data, error } = await (sb as any).rpc("sitemap_city_cat_counts", { p_city_ids: slice });
    if (error) { console.log(`  batch ${i}: ERR ${error.message.slice(0,90)}`); continue; }
    const rows = (data || []) as { c: number; v: number; n: number }[];
    for (const r of rows) if (btpIds.has(r.c)) { combos3++; villesCouvertes.add(r.v); }
    batches++;
    process.stdout.write(`  batch ${i}-${i+slice.length}: ${rows.length} combos bruts (cumul BTP >=3 : ${combos3})\n`);
  }
  console.log(`\nCOMBOS (metier BTP/domicile/personne x ville) avec >= 3 pros, TOUTES villes : ${combos3}`);
  console.log(`Villes concernees : ${villesCouvertes.size} / ${ids.length}`);
})().catch(e => { console.error(e.message); process.exit(1); });
