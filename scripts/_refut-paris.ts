import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data: cat } = await sb.from("categories").select("id").eq("slug","plombier").limit(1);
  for (const slug of ["paris","lyon","lille","nice","bordeaux","marseille","montpellier"]) {
    const { data: c } = await sb.from("cities").select("id,name").eq("slug", slug).limit(30);
    if (!c?.length) { console.log(slug,"introuvable"); continue; }
    const { count: ouv } = await sb.from("pros").select("id",{count:"exact",head:true})
      .in("city_id", c.map(x=>x.id)).eq("category_id", cat![0].id).eq("is_active",true).is("deleted_at",null)
      .or("etat_admin.is.null,etat_admin.neq.F");
    console.log(`${slug.padEnd(12)} (${c.length} ligne(s) ville) plombiers OUVERTS = ${ouv}`);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
