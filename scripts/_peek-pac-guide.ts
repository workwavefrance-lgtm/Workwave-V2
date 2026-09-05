import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async()=>{
  const { data } = await sb.from("price_guides").select("title, intro_md, price_ranges, faq, status, price_retrieved_at").eq("slug","prix-installation-pompe-a-chaleur").maybeSingle();
  if(!data){ console.log("introuvable"); return; }
  console.log(`Titre: ${data.title} | status=${data.status} | maj=${data.price_retrieved_at}`);
  console.log(`\nFourchettes de prix:`);
  for(const r of (data.price_ranges as any[])||[]) console.log(`  - ${r.label}: ${r.low}-${r.high} €${r.unit||""}`);
  const faqQ = ((data.faq as any[])||[]).map(f=>f.q);
  console.log(`\nFAQ (${faqQ.length}): ${faqQ.join(" | ")}`);
  console.log(`\nMaPrimeRénov mentionné ? ${JSON.stringify(data).toLowerCase().includes("maprimer")||JSON.stringify(data).toLowerCase().includes("prime")?"OUI":"non"}`);
})().catch(e=>console.error(e.message));
