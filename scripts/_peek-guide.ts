import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async()=>{
  const { data } = await sb.from("seo_guides").select("*").ilike("slug","%pose-carrelage%").limit(1).maybeSingle();
  if(!data){ const {data:any}=await sb.from("seo_guides").select("*").limit(1); console.log("colonnes:", Object.keys((any||[])[0]||{})); return; }
  console.log("COLONNES:", Object.keys(data).join(", "));
  console.log("\nEXEMPLE (valeurs tronquées):");
  for(const [k,v] of Object.entries(data)){
    const s = typeof v === "string" ? v.slice(0,120) : JSON.stringify(v)?.slice(0,200);
    console.log(`  ${k}: ${s}`);
  }
})().catch(e=>console.error(e.message));
