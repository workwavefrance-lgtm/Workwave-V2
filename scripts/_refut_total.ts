import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  for (const min of [1, 3]) {
    const t0 = Date.now();
    const { data, error } = await sb.rpc("sitemap_city_cat_total", { p_min: min });
    console.log(`p_min=${min} ->`, error ? "ERREUR " + error.message : data, `(${Date.now() - t0} ms)`);
  }
})();
