import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function main() {
  const { data: cats } = await sb.from("categories").select("id,slug,naf_codes").in("slug",["plombier","electricien","menuisier"]);
  console.log("CATEGORIES + NAF :");
  for (const c of cats??[]) console.log(` ${c.slug} id=${c.id} naf=${JSON.stringify(c.naf_codes)}`);

  const { data: deps } = await sb.from("departments").select("id,code,name").in("code",["75","69","13","23"]);
  for (const d of deps??[]) {
    const { data: cs } = await sb.from("cities").select("id").eq("department_id", d.id);
    const ids = (cs??[]).map(c=>c.id);
    console.log(`\n=== DEPT ${d.code} ${d.name} : ${ids.length} communes en base ===`);
    for (const c of cats??[]) {
      const { count: tot } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",c.id).in("city_id",ids).is("deleted_at",null).eq("is_active",true);
      const { count: ouv } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",c.id).in("city_id",ids).is("deleted_at",null).eq("is_active",true).neq("etat_admin","F");
      console.log(`  ${c.slug.padEnd(12)} total=${String(tot).padStart(6)}  ouverts=${String(ouv).padStart(6)}`);
    }
  }
}
main().catch(e=>console.error(e));
