/** Comparaison stricte : la MEME requete que ce matin avant le rattrapage. */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const t = Date.now();
  const r = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F");
  console.log(`  fiches OUVERTES (meme requete que ce matin) : ${r.error ? "ECHEC " + r.error.message : r.count} (${Date.now() - t} ms)`);
  console.log(`  ce matin avant le rattrapage               : 1233039`);
  if (!r.error) console.log(`  GAIN NET                                   : +${(r.count || 0) - 1233039} fiches ouvertes`);
})();
