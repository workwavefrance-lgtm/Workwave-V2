import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEBUT_ID = 4441001, MAX_ID = 5142814, BANDE = 60000;

(async () => {
  let total = 0, actifs = 0, duRun = 0;
  const parAnnee: Record<string, number> = {};
  for (let a = 0; a < MAX_ID; a += BANDE) {
    const b = a + BANDE;
    let offset = 0;
    while (true) {
      const { data, error } = await sb.from("pros")
        .select("id, founded_year, is_active, deleted_at")
        .gte("founding_date", "1900-01-01").lt("founding_date", "1900-01-02")
        .gte("id", a).lt("id", b)
        .range(offset, offset + 999).abortSignal(AbortSignal.timeout(120_000));
      if (error) { console.log(`\nERREUR bande ${a}-${b} offset ${offset} : ${error.message}`); return; }
      const rows = data || [];
      if (rows.length === 0) break;
      for (const r of rows) {
        total++;
        if (r.is_active && !r.deleted_at) actifs++;
        if (r.id >= DEBUT_ID) duRun++;
        parAnnee[String(r.founded_year)] = (parAnnee[String(r.founded_year)] || 0) + 1;
      }
      offset += rows.length;
    }
    process.stdout.write(`\r  bande ${a} -> ${total} lignes   `);
  }
  console.log(`\nfounding_date = 1900-01-01 : ${total} lignes`);
  console.log(`  actives et non supprimees : ${actifs}`);
  console.log(`  creees par le run du 05/09 (id >= ${DEBUT_ID}) : ${duRun}`);
  console.log(`  founded_year : ${JSON.stringify(parAnnee)}`);
})();
