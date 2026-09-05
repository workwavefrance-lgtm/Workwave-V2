import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data: dept } = await sb.from("departments").select("id").eq("code", "33").limit(1);
  const { data: cat } = await sb.from("categories").select("id").eq("slug", "electricien").limit(1);
  const { data: villes } = await sb.from("cities").select("id,name,population")
    .eq("department_id", dept![0].id).order("population", { ascending: false }).limit(40);
  const medianes: number[] = []; let sansDonnee = 0; let moins3 = 0;
  for (const v of villes!) {
    const { data } = await sb.from("pros").select("founded_year")
      .eq("is_active", true).is("deleted_at", null).neq("etat_admin", "F")
      .eq("city_id", v.id).eq("category_id", cat![0].id).not("founded_year", "is", null);
    const ys = (data || []).map((x: any) => x.founded_year).sort((a, b) => a - b);
    if (ys.length === 0) { sansDonnee++; console.log(`${v.name.padEnd(24)} aucune donnee`); continue; }
    if (ys.length < 3) moins3++;
    const m = ys[Math.floor(ys.length / 2)];
    medianes.push(m);
    console.log(`${v.name.padEnd(24)} n=${String(ys.length).padStart(3)} · mediane ${m}`);
  }
  console.log(`\ncommunes sans aucune annee : ${sansDonnee}/40 · avec moins de 3 pros dates : ${moins3}/40`);
  console.log(`valeurs de mediane DISTINCTES : ${new Set(medianes).size} pour ${medianes.length} communes`);
})();
