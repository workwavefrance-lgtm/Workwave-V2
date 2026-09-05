import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  // combien de tranches de 45 000 sont reellement peuplees : on demande a la
  // RPC du sitemap l'identifiant de depart de chaque tranche. -1 = tranche vide.
  for (const n of [40, 42, 43, 44, 45, 46, 47, 48, 50, 55, 59, 60]) {
    const t0 = Date.now();
    const { data, error } = await (sb as any).rpc("sitemap_batch_start_id", { skip_count: n * 45000, tech_mode: false });
    console.log(`tranche ${n} (saut ${n * 45000}) -> ${error ? "ERREUR " + error.message : JSON.stringify(data)}   ${Date.now() - t0} ms`);
  }
})();
