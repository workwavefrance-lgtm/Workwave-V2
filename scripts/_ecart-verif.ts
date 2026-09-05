import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  // villes du sitemap = top 300 population
  const { data: top } = await sb.from("cities").select("id,slug,population").order("population", { ascending: false }).limit(300);
  const topIds = new Set((top||[]).map((c:any)=>c.id));
  console.log("population min du top300:", (top as any[])[299]?.population, "->", (top as any[])[299]?.slug);
  // trouve 5 combos >=3 pros HORS top300
  const { data: cities } = await sb.from("cities").select("id,slug,population").order("population",{ascending:false}).range(300, 3300);
  const ids = (cities||[]).map((c:any)=>c.id);
  const slug = new Map((cities||[]).map((c:any)=>[c.id, c.slug]));
  const { data } = await (sb as any).rpc("sitemap_city_cat_counts", { p_city_ids: ids });
  const { data: cats } = await sb.from("categories").select("id,slug,vertical").in("vertical",["btp","domicile","personne"]);
  const cs = new Map((cats||[]).map((c:any)=>[c.id,c.slug]));
  const rows = ((data||[]) as any[]).filter(r=>cs.has(r.c)).sort((a,b)=>b.n-a.n).slice(0,6);
  for (const r of rows) console.log(`https://workwave.fr/${cs.get(r.c)}/${slug.get(r.v)}   (${r.n} pros)`);
})().catch(e=>{console.error(e.message);process.exit(1);});
