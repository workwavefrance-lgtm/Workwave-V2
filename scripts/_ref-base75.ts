import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  for (const cat of [1, 2, 3, 4, 5]) {
    for (let tent = 1; tent <= 3; tent++) {
      const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
        .eq("category_id", cat).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A").like("postal_code", "75%");
      if (!error) { console.log(`cat ${cat} Paris ouverts = ${count}`); break; }
      console.log(`cat ${cat} tentative ${tent} ERREUR: "${error.message}" code=${error.code}`);
    }
  }
})();
