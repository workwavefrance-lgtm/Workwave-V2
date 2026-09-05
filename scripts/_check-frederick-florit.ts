import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async()=>{
  const { data: pro } = await sb.from("pros")
    .select("id, name, email, siret, source, claimed_by_user_id, claimed_at, subscription_product, subscription_status, category_id, city:cities(name)")
    .or("siret.eq.75402769600030,email.eq.tissot.david@gmail.com").maybeSingle();
  if(!pro){ console.log("pro introuvable"); return; }
  const { data: cat } = await sb.from("categories").select("id, slug, name, vertical").eq("id", pro.category_id).single();
  console.log("PRO :", JSON.stringify({name:pro.name, email:pro.email, ville:(pro.city as any)?.name, source:pro.source, claimed:!!pro.claimed_by_user_id, claimed_at:pro.claimed_at, sub_product:pro.subscription_product, sub_status:pro.subscription_status}, null, 2));
  console.log("CATÉGORIE :", JSON.stringify(cat));
  // Y a-t-il des projets tech (vertical tech) déposés récemment ? Comment seraient-ils diffusés ?
  const { count: techProjects } = await sb.from("projects").select("id",{count:"exact",head:true}).eq("vertical","tech");
  const { count: webProjects } = await sb.from("projects").select("id",{count:"exact",head:true}).eq("category_id", pro.category_id);
  console.log(`\nProjets vertical 'tech' en base : ${techProjects} · projets catégorie Dev Web : ${webProjects}`);
})().catch(e=>console.error(e.message));
