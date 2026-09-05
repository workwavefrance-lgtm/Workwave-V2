import { config } from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  const { data: pros } = await sb.from("pros")
    .select("category_id,enabled_category_ids")
    .not("claimed_by_user_id","is",null).eq("is_active",true).is("deleted_at",null);
  const occupees = new Set<number>();
  (pros||[]).forEach((p:any)=>{ if(p.category_id) occupees.add(p.category_id); (p.enabled_category_ids||[]).forEach((id:number)=>occupees.add(id)); });
  const { data: cats } = await sb.from("categories").select("id,name,slug,vertical")
    .in("vertical",["btp","domicile","personne"]).order("name");
  const libres = (cats||[]).filter((c:any)=>!occupees.has(c.id));
  console.log(`categories occupees par au moins un pro reclame : ${occupees.size}`);
  console.log(`categories SANS AUCUN pro reclame : ${libres.length}`);
  libres.slice(0,10).forEach((c:any)=>console.log(`   ${c.id.toString().padStart(4)}  ${c.name}  (${c.slug})`));
})();
