import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  // combien de fiches au total dans les 12 depts des metropoles ?
  const codes = ["75","13","69","31","06","44","34","67","33","59","35","51"];
  let tot = 0, ouv = 0;
  for (const code of codes) {
    const { data: d } = await sb.from("departments").select("id").eq("code", code).limit(1);
    if (!d?.length) continue;
    let off = 0; const ids: number[] = [];
    while (true) { const { data } = await sb.from("cities").select("id").eq("department_id", d[0].id).range(off, off+999);
      const rows = data||[]; if (!rows.length) break; ids.push(...rows.map(r=>r.id)); off += rows.length; }
    for (let i=0;i<ids.length;i+=500) {
      const ch = ids.slice(i,i+500);
      const { count: t } = await sb.from("pros").select("id",{count:"exact",head:true}).in("city_id",ch).eq("is_active",true).is("deleted_at",null);
      const { count: o } = await sb.from("pros").select("id",{count:"exact",head:true}).in("city_id",ch).eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F");
      tot += t||0; ouv += o||0;
    }
    console.log(`  dept ${code} cumul en cours : ${tot} fiches`);
  }
  console.log(`\n12 depts de metropoles : ${tot} fiches actives dont ${ouv} ouvertes`);
})().catch(e=>{console.error(e.message);process.exit(1);});
