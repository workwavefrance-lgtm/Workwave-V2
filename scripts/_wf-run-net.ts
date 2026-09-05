import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEBUT_ID = 4441001;
async function c(nom: string, f: (q: any) => any) {
  for (let i = 1; i <= 3; i++) {
    const t0 = Date.now();
    const { count, error } = await f(sb.from("pros").select("id", { count: "exact", head: true })).abortSignal(AbortSignal.timeout(200_000));
    if (!error && count != null) { console.log(`${nom} : ${count.toLocaleString("fr-FR")} (${((Date.now()-t0)/1000).toFixed(1)} s)`); return count; }
    console.log(`  essai ${i} : ${error?.message || "count null"}`);
  }
  console.log(`${nom} : NON MESURE`); return null;
}
(async () => {
  const tot = await c("lignes creees par le run (id >= " + DEBUT_ID + ")", (q) => q.gte("id", DEBUT_ID));
  const sansDate = await c("  dont founding_date vide", (q) => q.gte("id", DEBUT_ID).is("founding_date", null));
  const source = await c("  dont source = sirene", (q) => q.gte("id", DEBUT_ID).eq("source", "sirene"));
  if (tot != null && sansDate != null) console.log(`  => avec founding_date : ${(tot - sansDate).toLocaleString("fr-FR")}`);
  await c("lignes hors run (id < " + DEBUT_ID + ")", (q) => q.lt("id", DEBUT_ID));
})();
