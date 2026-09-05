import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async()=>{
  const { count } = await sb.from("price_guides").select("id",{count:"exact",head:true}).eq("status","published");
  console.log(`price_guides publiés : ${count}`);
  const { data: pac } = await sb.from("price_guides").select("slug").or("slug.ilike.%pompe%,slug.ilike.%pac%,slug.ilike.%chaleur%");
  console.log(`PAC déjà présent : ${pac?.length ? pac.map(x=>x.slug).join(", ") : "NON (0)"}`);
  // univers utilisé par chauffagiste
  const { data: ch } = await sb.from("price_guides").select("slug, metier_slug, univers, scope").eq("metier_slug","chauffagiste").limit(5);
  console.log(`Guides chauffagiste existants :`); for(const g of ch||[]) console.log(`  ${g.slug} | univers=${g.univers} | scope=${g.scope}`);
})().catch(e=>console.error(e.message));
