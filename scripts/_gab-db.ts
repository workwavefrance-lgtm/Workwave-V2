import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
async function cnt(label: string, build: (q: any) => any) {
  let q = sb.from("pros").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("is_active", true).or(OUVERT);
  q = build(q);
  const { count, error } = await q;
  console.log(`${label.padEnd(58)} ${error ? "ERR " + error.message.slice(0,60) : count}`);
  return count ?? 0;
}
async function main() {
  const base = await cnt("pros actifs OUVERTS (total)", (q)=>q);
  await cnt("  ... avec google_rating non nul", (q)=>q.not("google_rating","is",null));
  await cnt("  ... avec workwave_reviews_count > 0", (q)=>q.gt("workwave_reviews_count",0));
  await cnt("  ... avec photos non vide (jsonb <> '[]')", (q)=>q.neq("photos","[]"));
  await cnt("  ... avec description non nulle", (q)=>q.not("description","is",null));
  await cnt("  ... avec phone non nul", (q)=>q.not("phone","is",null));
  await cnt("  ... avec website non nul", (q)=>q.not("website","is",null));
  await cnt("  ... avec founded_year non nul", (q)=>q.not("founded_year","is",null));
  await cnt("  ... avec rge_certified = true", (q)=>q.eq("rge_certified",true));
  await cnt("  ... avec certifications <> '[]'", (q)=>q.neq("certifications","[]"));
  await cnt("  ... reclames (claimed_by_user_id non nul)", (q)=>q.not("claimed_by_user_id","is",null));
  await cnt("  ... profile_completion > 0", (q)=>q.gt("profile_completion",0));
  console.log("\n-- Lyon climaticien --");
  const { data: cat } = await sb.from("categories").select("id,slug,name").eq("slug","climaticien").single();
  const { data: city } = await sb.from("cities").select("id,name").eq("slug","lyon").limit(5);
  console.log("categorie:", cat, "villes lyon:", city);
  for (const c of city ?? []) {
    const { count } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id", cat!.id).eq("city_id", c.id).is("deleted_at",null).eq("is_active",true).or(OUVERT);
    console.log(`  city_id ${c.id} (${c.name}) : ${count} climaticiens ouverts`);
  }
  console.log("\n-- Gironde demenagement --");
  const { data: catD } = await sb.from("categories").select("id").eq("slug","demenagement").single();
  const { data: dep } = await sb.from("departments").select("id,code,name").eq("code","33").single();
  const { data: cityIds } = await sb.from("cities").select("id").eq("department_id", dep!.id).limit(1000);
  const ids = (cityIds??[]).map(c=>c.id);
  const { count: nD } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id", catD!.id).in("city_id", ids).is("deleted_at",null).eq("is_active",true).or(OUVERT);
  console.log(`  demenageurs Gironde ouverts (sur ${ids.length} communes chargees) : ${nD}`);
  // doublons ADAM
  const { data: adam } = await sb.from("pros").select("id,name,siret,slug,city_id,profile_completion,claimed_by_user_id").eq("category_id", catD!.id).in("city_id", ids).ilike("name","ADAM EXPLOITATION").is("deleted_at",null).eq("is_active",true);
  console.log("  fiches 'ADAM EXPLOITATION' :", (adam??[]).length, JSON.stringify((adam??[]).map(a=>({slug:a.slug,siret:a.siret,pc:a.profile_completion}))));
}
main().catch(e=>console.error(e.message));
