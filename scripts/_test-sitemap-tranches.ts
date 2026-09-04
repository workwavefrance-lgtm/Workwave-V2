import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  let total = 0; const echantillon: string[] = [];
  for (let b = 0; b < 4; b++) {
    const t = Date.now();
    const { data, error } = await sb.rpc("sitemap_city_cat_page", { p_offset: b * 45000, p_limit: 45000, p_min: 3 });
    if (error) { console.log(`tranche ${b} : ERREUR ${error.message}`); continue; }
    const rows = (data || []) as { m: string; v: string; n: number }[];
    total += rows.length;
    console.log(`tranche ${b} (sitemap/${300 + b}.xml) : ${rows.length} adresses en ${((Date.now() - t) / 1000).toFixed(1)} s`);
    for (let i = 0; i < rows.length && echantillon.length < (b + 1) * 6; i += Math.max(1, Math.floor(rows.length / 6))) {
      echantillon.push(`/${rows[i].m}/${rows[i].v}`);
    }
  }
  console.log(`TOTAL declare : ${total} (attendu 83 406)`);
  console.log("\nEchantillon a tester :"); echantillon.forEach((u) => console.log(u));
})();
