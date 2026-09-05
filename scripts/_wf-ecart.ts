import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb: any = getServiceClient();
(async () => {
  const cibles = [["plombier","montpellier"],["electricien","marseille"],["macon","toulouse"],["peintre","lille"],["couvreur","strasbourg"],["plombier","nice"]];
  for (const [m, v] of cibles) {
    const { data: c } = await sb.from("categories").select("id").eq("slug", m).single();
    const { data: vi } = await sb.from("cities").select("id").eq("slug", v).limit(1);
    if (!c || !vi?.length) { console.log(m, v, "introuvable"); continue; }
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("category_id", c.id).eq("city_id", vi[0].id).eq("is_active", true).is("deleted_at", null)
      .or("etat_admin.is.null,etat_admin.neq.F");
    console.log(`/${m}/${v} : ${error ? "ERREUR " + error.message : count} artisans ouverts EN BASE`);
  }
})();
