import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("pros")
    .select("slug, name, siret, founding_date, founded_year, forme_juridique, effectif_range, naf_code, description, rge_certified, nom_commercial, enseignes, categories(name, slug), cities(name, postal_code, departments(name, code))")
    .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F")
    .not("founding_date", "is", null).not("naf_code", "is", null).limit(6);
  console.log(JSON.stringify(data, null, 1));
})();
