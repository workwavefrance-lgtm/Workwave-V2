import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEBUT = "2026-09-05T07:00:00Z";

async function compte(nom: string, f: (q: any) => any, essais = 3) {
  for (let i = 1; i <= essais; i++) {
    const t0 = Date.now();
    try {
      const { count, error } = await f(sb.from("pros").select("id", { count: "exact", head: true }))
        .abortSignal(AbortSignal.timeout(240_000));
      if (error) { console.log(`  essai ${i} : erreur "${error.message}" code=${error.code}`); continue; }
      if (count == null) { console.log(`  essai ${i} : count null`); continue; }
      console.log(`${nom} : ${count.toLocaleString("fr-FR")}   (${((Date.now()-t0)/1000).toFixed(1)} s)`);
      return count;
    } catch (e: any) { console.log(`  essai ${i} : exception ${e?.message || e}`); }
  }
  console.log(`${nom} : NON MESURE`);
  return null;
}

(async () => {
  await compte("founding_date = 1900-01-01 (toute la base)", (q) => q.eq("founding_date", "1900-01-01"));
  await compte("founding_date entre 1900-01-01 et 1900-12-31", (q) => q.gte("founding_date","1900-01-01").lte("founding_date","1900-12-31"));
  await compte("founding_date < 1900-01-01", (q) => q.lt("founding_date", "1900-01-01"));
  await compte("lignes creees pendant le run", (q) => q.gte("created_at", DEBUT));
  await compte("lignes creees pendant le run, founding_date = 1900-01-01", (q) => q.gte("created_at", DEBUT).gte("founding_date","1900-01-01").lte("founding_date","1900-12-31"));
})();
