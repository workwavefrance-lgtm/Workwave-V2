import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERTS = "etat_admin.is.null,etat_admin.neq.F";
const NAFS = ["9601A","5320Z","9522Z","8891A","8559A","8559B","8810A","8899B","8899A","9609Z"];
(async () => {
  for (const naf of NAFS) {
    const { data, error } = await sb.from("pros").select("name, category_id")
      .eq("naf_code", naf).eq("is_active", true).is("deleted_at", null).or(OUVERTS).limit(25);
    if (error) { console.log(`\n### ${naf} ERREUR ${error.message}`); continue; }
    console.log(`\n### ${naf} — ${(data||[]).length} noms :`);
    for (const r of data || []) console.log(`  [cat ${r.category_id}] ${r.name}`);
  }
})();
