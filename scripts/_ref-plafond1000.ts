import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { getTopCities } from "../lib/queries/cities";
const sb = getServiceClient();
(async () => {
  const { data: cats } = await sb.from("categories").select("id,vertical").in("vertical", ["btp","domicile","personne"]);
  const btp = new Set((cats||[]).map((c:any)=>c.id));
  for (const n of [300, 35163]) {
    const villes = await getTopCities(n);
    const ids = villes.map((c:any)=>c.id);
    const { data } = await (sb as any).rpc("sitemap_city_cat_counts", { p_city_ids: ids });
    const rows = (data||[]) as any[];
    const btpRows = rows.filter(r => btp.has(r.c));
    console.log(`TOP_CITIES_FOR_LISTINGS = ${n} -> ${villes.length} villes chargees -> ${btpRows.length} combos BTP >=3 (sur ${rows.length} bruts)`);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
