import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { FILTRE_OUVERTS } from "../lib/queries/pros";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("seo_pages").select("id,slug,type,category_id,city_id").eq("type","metier_ville").order("id").range(0,999);
  const rows = (data||[]) as any[];
  console.log("metier_ville:", rows.length);
  let zero = 0, sous3 = 0, ok = 0;
  const exemples: string[] = [];
  for (const r of rows) {
    const { count } = await sb.from("pros").select("id",{count:"exact",head:true})
      .eq("category_id", r.category_id).eq("city_id", r.city_id)
      .eq("is_active", true).is("deleted_at", null).or(FILTRE_OUVERTS);
    const n = count||0;
    if (n === 0) { zero++; if (exemples.length<8) exemples.push(`${r.slug} (0 pro ouvert)`); }
    else if (n < 3) sous3++;
    else ok++;
  }
  console.log("  0 pro ouvert -> la page redirige en 308, contenu jamais affiche :", zero);
  console.log("  1-2 pros ouverts (page servie) :", sous3);
  console.log("  >=3 pros ouverts :", ok);
  console.log("  exemples:", exemples.join(" | "));
})();
