import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  // taux de remplissage des donnees d enrichissement proposees par l audit, sur les fiches OUVERTES
  const champs = ["founded_year","date_creation","nature_juridique","tranche_effectif","rge","phone","email","description"];
  console.log("=== I. LES DONNEES QUE L AUDIT VEUT AFFICHER EXISTENT-ELLES ? (fiches ouvertes) ===");
  const { count: base } = await sb.from("pros").select("id",{count:"exact",head:true})
    .eq("is_active",true).is("deleted_at",null).neq("etat_admin","F");
  for (const c of champs) {
    try {
      const { count, error } = await sb.from("pros").select("id",{count:"exact",head:true})
        .eq("is_active",true).is("deleted_at",null).neq("etat_admin","F").not(c,"is",null);
      if (error) { console.log(`  ${c.padEnd(18)} : colonne absente (${error.message.slice(0,40)})`); continue; }
      console.log(`  ${c.padEnd(18)} : ${String(count).padStart(9)} / ${base} = ${(100*(count||0)/(base||1)).toFixed(1)}%`);
    } catch(e){ console.log(`  ${c.padEnd(18)} : ${(e as Error).message.slice(0,40)}`); }
  }
})().catch(e=>console.error(e.message));
