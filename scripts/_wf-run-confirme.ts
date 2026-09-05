import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEBUT = "2026-09-05T07:00:00Z";
(async () => {
  for (let i = 1; i <= 6; i++) {
    const t0 = Date.now();
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .gte("created_at", DEBUT).not("founding_date", "is", null).abortSignal(AbortSignal.timeout(200_000));
    if (!error && count != null) { console.log(`lignes creees le 05/09 avec founding_date : ${count} (${((Date.now()-t0)/1000).toFixed(1)} s)`); return; }
    await new Promise(r => setTimeout(r, 8000));
  }
  console.log("NON MESURE");
})();
