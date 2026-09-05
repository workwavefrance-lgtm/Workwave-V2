import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEBUT = "2026-09-05T07:00:00Z";
async function c(nom: string, f: (q: any) => any, essais = 5) {
  for (let i = 1; i <= essais; i++) {
    const t0 = Date.now();
    const { count, error } = await f(sb.from("pros").select("id", { count: "exact", head: true })).abortSignal(AbortSignal.timeout(200_000));
    if (!error && count != null) { console.log(`${nom} : ${count.toLocaleString("fr-FR")} (${((Date.now()-t0)/1000).toFixed(1)} s)`); return count; }
    await new Promise(r => setTimeout(r, 5000));
  }
  console.log(`${nom} : NON MESURE`); return null;
}
(async () => {
  await c("lignes creees pendant le run, founding_date vide", (q) => q.gte("created_at", DEBUT).is("founding_date", null));
  await c("lignes creees pendant le run, founding_date renseignee", (q) => q.gte("created_at", DEBUT).not("founding_date", "is", null));
  await c("lignes creees pendant le run, founded_year renseigne", (q) => q.gte("created_at", DEBUT).not("founded_year", "is", null));
})();
