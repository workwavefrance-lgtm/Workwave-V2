import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  const { data: cats } = await sb.from("categories").select("id,slug").in("slug",["plombier","electricien","macon","peintre","menuisier"]);
  const { data: deps } = await sb.from("departments").select("id,code,name").in("code",["69","75","13","33","31","59","06","44","86","23"]);
  const cityCache: Record<number, number[]> = {};
  for (const d of deps??[]) {
    const { data: cs } = await sb.from("cities").select("id").eq("department_id", d.id).limit(1000);
    cityCache[d.id] = (cs??[]).map(c=>c.id);
  }
  console.log("TOTAL de fiches en base (ouvertes + fermees) par metier x departement");
  console.log("dept".padEnd(22) + (cats??[]).map(c=>c.slug.slice(0,10).padStart(12)).join(""));
  for (const d of (deps??[]).sort((a,b)=>a.code.localeCompare(b.code))) {
    const line: string[] = [];
    for (const c of cats??[]) {
      const { count } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",c.id).in("city_id",cityCache[d.id]).is("deleted_at",null).eq("is_active",true);
      line.push(String(count).padStart(12));
    }
    console.log(`${d.code} ${d.name}`.padEnd(22) + line.join(""));
  }
}
main().catch(e=>console.error(e.message));
