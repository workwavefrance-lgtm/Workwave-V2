import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  for (const [nom, f] of [
    ["lignes d'id >= 4441001 (plage du run)", (q: any) => q.gte("id", 4441001)],
    ["  dont creees le 05/09 apres 07h UTC", (q: any) => q.gte("id", 4441001).gte("created_at", "2026-09-05T07:00:00Z")],
  ] as const) {
    for (let i = 1; i <= 3; i++) {
      const t0 = Date.now();
      const { count, error } = await f(sb.from("pros").select("id", { count: "exact", head: true })).abortSignal(AbortSignal.timeout(120_000));
      if (!error && count != null) { console.log(`${nom} : ${count} (${((Date.now()-t0)/1000).toFixed(1)} s)`); break; }
      if (i === 3) console.log(`${nom} : NON MESURE`);
      await new Promise(r => setTimeout(r, 4000));
    }
  }
})();
