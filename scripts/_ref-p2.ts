import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  // 1) lignes-arrondissements eventuelles
  const { data: c1 } = await sb.from("cities").select("id,name,slug,insee_code,department_id,postal_code").ilike("name","%paris%").limit(30);
  console.log("cities LIKE paris :", JSON.stringify(c1,null,1));
  const { data: c2 } = await sb.from("cities").select("id,name,insee_code,department_id").like("insee_code","751%").limit(30);
  console.log("cities insee 751xx :", (c2??[]).length, JSON.stringify((c2??[]).slice(0,5)));
  // 2) pros plombier avec code postal 75xxx quelle que soit la ville
  const { count: cpAll } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",1).like("postal_code","75%").is("deleted_at",null).eq("is_active",true);
  console.log("plombier is_active, postal_code 75* (toutes villes) :", cpAll);
  // 3) created_at distribution des plombiers Paris
  const { data: cs } = await sb.from("cities").select("id").eq("department_id", (await sb.from("departments").select("id").eq("code","75").single()).data!.id);
  const ids=(cs??[]).map(c=>c.id);
  const { data: rows } = await sb.from("pros").select("created_at").eq("category_id",1).in("city_id",ids).is("deleted_at",null).eq("is_active",true).limit(2000);
  const byMonth: Record<string,number> = {};
  for (const r of rows??[]) { const m=(r.created_at||"").slice(0,7); byMonth[m]=(byMonth[m]||0)+1; }
  console.log("plombier Paris par mois de creation :", JSON.stringify(byMonth));
  // 4) idem dept 13 (1717 fiches, > plafond)
  const d13 = (await sb.from("departments").select("id").eq("code","13").single()).data!.id;
  const { data: cs13 } = await sb.from("cities").select("id").eq("department_id", d13);
  const ids13=(cs13??[]).map(c=>c.id);
  const { data: r13 } = await sb.from("pros").select("created_at").eq("category_id",1).in("city_id",ids13).is("deleted_at",null).eq("is_active",true).limit(3000);
  const m13: Record<string,number> = {};
  for (const r of r13??[]) { const m=(r.created_at||"").slice(0,7); m13[m]=(m13[m]||0)+1; }
  console.log("plombier B-du-R par mois de creation :", JSON.stringify(m13));
}
main().catch(e=>console.error(e));
