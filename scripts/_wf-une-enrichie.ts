import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("pros").select("slug, name, founding_date, founded_year, nombre_etablissements, categorie_entreprise")
    .not("sirene_enrichi_at", "is", null).not("nombre_etablissements","is",null).limit(5);
  for (const r of data || []) console.log(r.slug, "|", r.founding_date, "| etabs:", r.nombre_etablissements);
})();
