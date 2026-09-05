import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async()=>{
  const { data } = await sb.from("categories").select("slug, name, vertical")
    .in("vertical",["btp","domicile","personne"]).order("vertical").order("name");
  for(const v of ["btp","domicile","personne"]){
    console.log(`\n── ${v} ──`);
    for(const c of (data||[]).filter(x=>x.vertical===v)) console.log(`  ${c.slug}  (${c.name})`);
  }
})().catch(e=>console.error(e.message));
