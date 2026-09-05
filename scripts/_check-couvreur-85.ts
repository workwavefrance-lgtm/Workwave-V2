import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async()=>{
  const { data: dept } = await sb.from("departments").select("id, name").eq("code","85").maybeSingle();
  console.log("Vendée 85 :", dept || "ABSENT");
  const { data: cat } = await sb.from("categories").select("id").eq("slug","couvreur").single();
  if(dept){
    const { data: cityIds } = await sb.from("cities").select("id").eq("department_id", dept.id);
    const ids = (cityIds||[]).map((c:{id:number})=>c.id);
    const { count: tot } = await sb.from("pros").select("id",{count:"exact",head:true})
      .eq("category_id",cat!.id).in("city_id", ids.slice(0,1000)).eq("is_active",true).is("deleted_at",null);
    const { count: claimed } = await sb.from("pros").select("id",{count:"exact",head:true})
      .eq("category_id",cat!.id).in("city_id", ids.slice(0,1000)).eq("is_active",true).is("deleted_at",null).not("claimed_by_user_id","is",null);
    console.log(`Couvreurs Vendée 85 : ${tot} en base, ${claimed} réclamés`);
  }
  const { data: proj } = await sb.from("projects").select("id, broadcast_count, broadcasted_at").eq("id",84).maybeSingle();
  console.log("Projet #84 :", JSON.stringify(proj));
})().catch(e=>console.error(e.message));
