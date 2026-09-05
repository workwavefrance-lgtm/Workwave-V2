import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
const sb = getServiceClient();
const DEBUT_ID = 4441001;
(async () => {
  const ech: any[] = [];
  for (let i = 0; i < 20; i++) {
    const start = 1 + Math.floor(Math.random() * (DEBUT_ID - 100));
    const { data, error } = await sb.from("pros")
      .select("id, siret, slug, name, founding_date, founded_year, is_active, deleted_at, sirene_enrichi_at")
      .gte("id", start).order("id").limit(20).abortSignal(AbortSignal.timeout(60_000));
    if (error) { console.log("err", error.message); continue; }
    for (const r of data || []) {
      if (!r.siret || r.id >= DEBUT_ID) continue;
      if (!r.is_active || r.deleted_at) continue;
      if (r.sirene_enrichi_at) continue; // on veut la convention de masse
      ech.push(r);
    }
  }
  console.log(`echantillon ancien (id < ${DEBUT_ID}, actives, non enrichies) : ${ech.length}`);
  console.log(`  dont founding_date renseignee : ${ech.filter(e => e.founding_date).length}`);
  fs.writeFileSync("/tmp/wf-echantillon-ancien.json", JSON.stringify(ech.filter(e => e.founding_date), null, 1));
})();
