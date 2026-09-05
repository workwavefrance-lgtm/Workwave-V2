import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data, error } = await sb.from("pros").select("id, founded_year, founding_date, etat_admin, entreprise_etat")
    .gte("id", 5000000).order("id").limit(1000).abortSignal(AbortSignal.timeout(60_000));
  if (error) { console.log("ERREUR", error.message); return; }
  const r = data || [];
  console.log(`1 000 lignes du run lues (id >= 5 000 000)`);
  console.log(`  founded_year renseigne : ${r.filter(x => x.founded_year != null).length}`);
  console.log(`  founding_date renseignee : ${r.filter(x => x.founding_date != null).length}`);
  console.log(`  etat_admin = A : ${r.filter(x => x.etat_admin === "A").length} | F : ${r.filter(x => x.etat_admin === "F").length}`);
})();
