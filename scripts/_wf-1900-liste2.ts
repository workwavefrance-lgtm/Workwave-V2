import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEBUT_ID = 4441001;

(async () => {
  let offset = 0, total = 0, actifs = 0, duRun = 0;
  const parAnnee: Record<string, number> = {};
  const vus = new Set<number>();
  while (true) {
    const t0 = Date.now();
    const { data, error } = await sb.from("pros")
      .select("id, founded_year, is_active, deleted_at, created_at")
      .gte("founding_date", "1900-01-01").lt("founding_date", "1900-01-02")
      .range(offset, offset + 999).abortSignal(AbortSignal.timeout(120_000));
    if (error) { console.log("ERREUR page", offset, error.message); return; }
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) {
      if (vus.has(r.id)) continue;
      vus.add(r.id);
      total++;
      if (r.is_active && !r.deleted_at) actifs++;
      if (r.id >= DEBUT_ID) duRun++;
      parAnnee[String(r.founded_year)] = (parAnnee[String(r.founded_year)] || 0) + 1;
    }
    process.stdout.write(`\r  offset ${offset} (+${rows.length}, ${((Date.now()-t0)/1000).toFixed(1)} s)   `);
    offset += rows.length;
  }
  console.log(`\nfounding_date = 1900-01-01 : ${total} lignes distinctes`);
  console.log(`  actives et non supprimees : ${actifs}`);
  console.log(`  creees par le run du 05/09 : ${duRun}`);
  console.log(`  founded_year : ${JSON.stringify(parAnnee)}`);
})();
