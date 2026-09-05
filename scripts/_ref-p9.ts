import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: deps } = await sb.from("departments").select("id,code,name").in("code",["75","69","13","59","33","31","06","44","34","76"]);
  for (const d of (deps??[]).sort((a,b)=>a.code.localeCompare(b.code))) {
    const { data: cs } = await sb.from("cities").select("id").eq("department_id", d.id);
    const ids=(cs??[]).map(c=>c.id);
    const { count: tot } = await sb.from("pros").select("id",{count:"exact",head:true}).in("city_id",ids).is("deleted_at",null).eq("is_active",true);
    const { count: apres } = await sb.from("pros").select("id",{count:"exact",head:true}).in("city_id",ids).is("deleted_at",null).eq("is_active",true).gte("created_at","2026-08-04");
    console.log(`dept ${d.code} ${String(d.name).padEnd(22)} fiches=${String(tot).padStart(7)}  creees apres le fix du 04/08 = ${String(apres).padStart(6)}`);
  }
})();
