import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEBUT_ID = 4441001; // premiere ligne creee par le run du 05/09

(async () => {
  let lastId = 0, total = 0, actifs = 0, duRun = 0, avecAnnee1900 = 0;
  const parAnnee: Record<string, number> = {};
  while (true) {
    const { data, error } = await sb.from("pros")
      .select("id, founding_date, founded_year, is_active, deleted_at")
      .gte("founding_date", "1900-01-01").lt("founding_date", "1900-01-02")
      .gt("id", lastId).order("id").limit(1000).abortSignal(AbortSignal.timeout(120_000));
    if (error) { console.log("ERREUR", error.message); return; }
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) {
      total++;
      if (r.is_active && !r.deleted_at) actifs++;
      if (r.id >= DEBUT_ID) duRun++;
      if (r.founded_year === 1900) avecAnnee1900++;
      parAnnee[String(r.founded_year)] = (parAnnee[String(r.founded_year)] || 0) + 1;
    }
    lastId = rows[rows.length - 1].id;
  }
  console.log(`founding_date = 1900-01-01 : ${total} lignes`);
  console.log(`  dont actives et non supprimees : ${actifs}`);
  console.log(`  dont creees par le run du 05/09 (id >= ${DEBUT_ID}) : ${duRun}`);
  console.log(`  founded_year associe : ${JSON.stringify(parAnnee)}`);
})();
