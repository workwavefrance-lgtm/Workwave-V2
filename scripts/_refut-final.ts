import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { FILTRE_OUVERTS } from "../lib/queries/pros";
(async () => {
  const sb = getServiceClient();
  const base = () => sb.from("pros").select("id",{count:"exact",head:true}).eq("is_active",true).is("deleted_at",null);
  const { count: neqF } = await base().neq("etat_admin","F");
  const { count: vraiOuv } = await base().or(FILTRE_OUVERTS);
  const { count: nul } = await base().is("etat_admin",null);
  const { count: rgeVrai } = await base().or(FILTRE_OUVERTS).eq("rge_certified", true);
  console.log("=== J. LE DENOMINATEUR DE L AUDIT EST-IL LE BON ? ===");
  console.log(`  .neq('etat_admin','F')  (methode audit) : ${neqF}   <- exclut les NULL`);
  console.log(`  FILTRE_OUVERTS (definition du code)     : ${vraiOuv}`);
  console.log(`  dont etat_admin IS NULL (jamais classe) : ${nul}`);
  console.log(`\n=== K. RGE : le levier "certification" existe-t-il vraiment ? ===`);
  console.log(`  fiches ouvertes avec rge_certified = true : ${rgeVrai} = ${(100*(rgeVrai||0)/(vraiOuv||1)).toFixed(2)}%`);
})().catch(e=>console.error(e.message));
