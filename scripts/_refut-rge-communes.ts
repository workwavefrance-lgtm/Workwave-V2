import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  // 40 communes de Gironde (dept du cas Bordeaux/Merignac) x categorie electricien
  const { data: dept } = await sb.from("departments").select("id,code").eq("code", "33").limit(1);
  const deptId = dept![0].id;
  const { data: cat } = await sb.from("categories").select("id,slug").eq("slug", "electricien").limit(1);
  const catId = cat![0].id;
  const { data: villes } = await sb.from("cities").select("id,name,population")
    .eq("department_id", deptId).order("population", { ascending: false }).limit(40);
  let zero = 0; const lignes: string[] = [];
  for (const v of villes!) {
    const b = () => sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null).neq("etat_admin", "F")
      .eq("city_id", v.id).eq("category_id", catId);
    const { count: tot } = await b();
    const { count: rge } = await b().eq("rge_certified", true);
    const pct = tot ? (rge! / tot) * 100 : 0;
    if (!rge) zero++;
    lignes.push(`${v.name.padEnd(24)} ${String(tot).padStart(4)} ouverts · RGE ${String(rge).padStart(3)} · ${pct.toFixed(0)} %`);
  }
  lignes.forEach(l => console.log(l));
  console.log(`\ncommunes (top 40 Gironde x electricien) avec ZERO pro RGE : ${zero}/40`);
})();
