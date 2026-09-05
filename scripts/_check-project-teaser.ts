import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async()=>{
  const { data } = await sb.from("projects")
    .select("id, category:categories(name), description, cleaned_description, has_contact_in_description, ai_qualification")
    .in("status",["new","routed"]).in("vertical",["btp","domicile","personne"])
    .order("created_at",{ascending:false}).limit(8);
  for(const p of (data||[]) as any[]){
    const aiq = p.ai_qualification || {};
    console.log(`\n#${p.id} ${p.category?.name}`);
    console.log(`  description (BRUTE, PII possible): ${(p.description||"").slice(0,120)}`);
    console.log(`  cleaned_description: ${(p.cleaned_description||"(vide)").slice(0,140)}`);
    console.log(`  has_contact_in_description: ${p.has_contact_in_description}`);
    console.log(`  ai_qualification keys: ${Object.keys(aiq).join(", ")}`);
    console.log(`  ai résumé: ${(aiq.resume||aiq.summary||aiq.resume_court||"(aucun)").toString().slice(0,160)}`);
  }
})().catch(e=>console.error(e.message));
