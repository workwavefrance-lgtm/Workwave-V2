import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data: cat } = await sb.from("categories").select("id").eq("slug","plombier").limit(1);
  const catId = cat![0].id;
  // Plombiers par departement (via cities.department_id) : la troncature 1000 etait par metier x dept
  const depts = [["33","Gironde"],["69","Rhone"],["31","Haute-Garonne"],["34","Herault"],["44","Loire-Atlantique"],["13","Bouches-du-Rhone"],["86","Vienne"]];
  console.log("dept              | plombiers actifs | OUVERTS | note");
  for (const [code, nom] of depts) {
    const { data: d } = await sb.from("departments").select("id").eq("code", code).limit(1);
    if (!d?.length) { console.log(`${code} introuvable`); continue; }
    // ids des villes du dept
    let ids: number[] = []; let off = 0;
    while (true) {
      const { data } = await sb.from("cities").select("id").eq("department_id", d[0].id).range(off, off+999);
      const r = data || []; if (!r.length) break; ids.push(...r.map(x=>x.id)); off += r.length;
    }
    const { count: tot } = await sb.from("pros").select("id",{count:"exact",head:true})
      .in("city_id", ids).eq("category_id", catId).eq("is_active",true).is("deleted_at",null);
    const { count: ouv } = await sb.from("pros").select("id",{count:"exact",head:true})
      .in("city_id", ids).eq("category_id", catId).eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F");
    const flag = (tot||0) >= 950 && (tot||0) <= 1050 ? "  <-- PILE 1000 = TRONQUE" : (tot||0)>=1900 && (tot||0)<=2100 ? "  <-- PILE 2000 = TRONQUE" : "";
    console.log(`${(code+" "+nom).padEnd(18)}| ${String(tot).padStart(16)} | ${String(ouv).padStart(7)} |${flag}`);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
