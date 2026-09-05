import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data: cat } = await sb.from("categories").select("id").eq("slug","plombier").limit(1);
  const cid = cat![0].id;
  for (const code of ["33","69","34","31","44","13","86","75"]) {
    const { data: d } = await sb.from("departments").select("id,name").eq("code", code).limit(1);
    if (!d?.length) { console.log(code, "dept introuvable"); continue; }
    // ids des villes du dept, pagine
    let off = 0; const ids: number[] = [];
    while (true) {
      const { data } = await sb.from("cities").select("id").eq("department_id", d[0].id).range(off, off+999);
      const rows = data || []; if (!rows.length) break; ids.push(...rows.map(r=>r.id)); off += rows.length;
    }
    // count par tranches de 1000 ids
    let tot=0, ouv=0;
    for (let i=0;i<ids.length;i+=500) {
      const chunk = ids.slice(i,i+500);
      const { count: t } = await sb.from("pros").select("id",{count:"exact",head:true}).in("city_id",chunk).eq("category_id",cid).eq("is_active",true).is("deleted_at",null);
      const { count: o } = await sb.from("pros").select("id",{count:"exact",head:true}).in("city_id",chunk).eq("category_id",cid).eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F");
      tot += t||0; ouv += o||0;
    }
    console.log(`dept ${code} ${String(d[0].name).padEnd(22)} villes ${String(ids.length).padStart(4)} | plombiers actifs ${String(tot).padStart(5)} | ouverts ${String(ouv).padStart(5)}`);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
