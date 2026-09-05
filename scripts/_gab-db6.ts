import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
async function main() {
  const { data: cat } = await sb.from("categories").select("id").eq("slug","plombier").single();
  for (const code of ["75","69","13","23","86"]) {
    const { data: d } = await sb.from("departments").select("id,name").eq("code",code).single();
    const { data: cs } = await sb.from("cities").select("id").eq("department_id", d!.id).limit(1000);
    const ids = (cs??[]).map(c=>c.id);
    const { count: ouv } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",cat!.id).in("city_id",ids).is("deleted_at",null).eq("is_active",true).or(OUVERT);
    console.log(`${code} ${d!.name.padEnd(20)} plombiers OUVERTS en base : ${ouv}`);
  }
}
main().catch(e=>console.error(e.message));
