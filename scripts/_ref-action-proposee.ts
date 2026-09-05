import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const ids: number[] = []; let off = 0;
  while (true) { const { data } = await sb.from("cities").select("id").order("id").range(off, off+999);
    const rows = data||[]; if (!rows.length) break; ids.push(...rows.map((r:any)=>r.id)); off += rows.length; }
  console.log("villes:", ids.length);
  for (const n of [300, 3000, 15000, ids.length]) {
    const t0 = Date.now();
    const { data, error } = await (sb as any).rpc("sitemap_city_cat_counts", { p_city_ids: ids.slice(0, n) });
    const ms = Date.now() - t0;
    console.log(`  p_city_ids = ${String(n).padStart(6)} -> ${ms} ms | ${error ? "ERREUR: " + error.message.slice(0,120) : (data?.length ?? 0) + " combos"}`);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
