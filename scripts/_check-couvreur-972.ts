import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async()=>{
  // Ducos / Martinique en base ?
  const { data: dept } = await sb.from("departments").select("id, code, name").eq("code","972").maybeSingle();
  console.log("Département 972 :", dept || "ABSENT");
  const { data: ducos } = await sb.from("cities").select("id, name, latitude, longitude, department_id").ilike("name","ducos").limit(5);
  console.log("Ville(s) Ducos :", JSON.stringify(ducos));

  const { data: cat } = await sb.from("categories").select("id").eq("slug","couvreur").single();
  // Couvreurs dans tout le 972 ?
  if (dept) {
    const { data: cityIds } = await sb.from("cities").select("id").eq("department_id", dept.id);
    const ids = (cityIds||[]).map((c:{id:number})=>c.id);
    const { count: tot } = await sb.from("pros").select("id",{count:"exact",head:true})
      .eq("category_id",cat!.id).in("city_id", ids.slice(0,1000)).eq("is_active",true).is("deleted_at",null);
    const { count: claimed } = await sb.from("pros").select("id",{count:"exact",head:true})
      .eq("category_id",cat!.id).in("city_id", ids.slice(0,1000)).eq("is_active",true).is("deleted_at",null).not("claimed_by_user_id","is",null);
    console.log(`Couvreurs en 972 : ${tot} en base, ${claimed} réclamés`);
  }
  // Le projet a-t-il touché quelqu'un ?
  const { data: proj } = await sb.from("projects").select("id, broadcast_count, broadcasted_at, created_at")
    .eq("vertical","btp").order("created_at",{ascending:false}).limit(3);
  console.log("3 derniers projets BTP :", JSON.stringify(proj));
})().catch(e=>console.error(e.message));
