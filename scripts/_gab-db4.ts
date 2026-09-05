import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
async function main() {
  // arrondissements Lyon
  const { data: villes } = await sb.from("cities").select("id,name,slug,postal_code").ilike("name","%Lyon%").limit(30);
  console.log("villes 'Lyon' en base :", JSON.stringify(villes));
  const { data: dep } = await sb.from("departments").select("id,code,name").eq("code","69").single();
  const { data: cityIds } = await sb.from("cities").select("id,name").eq("department_id", dep!.id).limit(1000);
  const ids = (cityIds??[]).map(c=>c.id);
  const { data: catP } = await sb.from("categories").select("id").eq("slug","plombier").single();
  const { count: rhone } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",catP!.id).in("city_id",ids).is("deleted_at",null).eq("is_active",true).or(OUVERT);
  console.log(`plombiers OUVERTS dans tout le Rhone (69, ${ids.length} communes) : ${rhone}`);
  const { count: rhoneF } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",catP!.id).in("city_id",ids).is("deleted_at",null).eq("is_active",true).eq("etat_admin","F");
  console.log(`plombiers FERMES dans le Rhone : ${rhoneF}`);
  // 1 seul pro par couple : echantillon sur une categorie
  console.log("\n-- combien de couples (plombier, ville) avec 1 seul pro ouvert, sur le Rhone --");
  const { data: rows } = await sb.from("pros").select("city_id").eq("category_id",catP!.id).in("city_id",ids).is("deleted_at",null).eq("is_active",true).or(OUVERT).limit(5000);
  const m: Record<number,number> = {};
  for (const r of rows??[]) m[(r as any).city_id] = (m[(r as any).city_id]??0)+1;
  const vals = Object.values(m);
  const un = vals.filter(v=>v===1).length, deux = vals.filter(v=>v<=2).length;
  console.log(`  communes du 69 avec >=1 plombier : ${vals.length} | exactement 1 : ${un} (${(100*un/vals.length).toFixed(0)}%) | <=2 : ${deux} (${(100*deux/vals.length).toFixed(0)}%)`);
}
main().catch(e=>console.error(e.message));
