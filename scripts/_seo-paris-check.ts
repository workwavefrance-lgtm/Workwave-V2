import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
/* eslint-disable @typescript-eslint/no-explicit-any */
(async () => {
  // pros par dept IDF (via cities.department code)
  const { data: idf } = await sb.from("departments").select("id,code,name").in("code",["75","77","78","91","92","93","94","95"]);
  console.log("=== Pros TOTAL (tous métiers) par dept IDF ===");
  for (const d of (idf as any[])) {
    const { data: cityIds } = await sb.from("cities").select("id").eq("department_id", d.id);
    const ids = (cityIds as any[]).map(c=>c.id);
    if (!ids.length) { console.log(`  ${d.code} ${d.name}: 0 ville`); continue; }
    const { count } = await sb.from("pros").select("id",{count:"exact",head:true}).in("city_id", ids).eq("is_active",true).is("deleted_at",null);
    const { count: serr } = await sb.from("pros").select("id",{count:"exact",head:true}).in("city_id", ids).eq("category_id",11).eq("is_active",true).is("deleted_at",null);
    console.log(`  ${d.code} ${d.name}: ${count} pros dont ${serr} serruriers · ${ids.length} villes`);
  }
  // les 4 villes paris
  const { data: pc } = await sb.from("cities").select("id,name,slug").ilike("name","paris%");
  console.log("\n=== Villes 'Paris*' ===");
  (pc as any[]).forEach(c=>console.log(`  ${c.id} ${c.name} (${c.slug})`));
})().catch(e=>console.error("ERR",e.message));
