import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEBUT_ID = 4441001, MAX_ID = 5142900, BANDE = 20000;
const DEPART = 0, ACQUIS = 0; // tally deja obtenu de 0 a 3 120 000
const dodo = (ms: number) => new Promise(r => setTimeout(r, ms));

(async () => {
  let total = ACQUIS, actifs = -1, duRun = 0;
  let actifsPartiel = 0;
  for (let a = DEPART; a < MAX_ID; a += BANDE) {
    const b = a + BANDE;
    let offset = 0, ok = false;
    while (!ok) {
      let rows: any[] | null = null;
      for (let essai = 1; essai <= 5 && rows === null; essai++) {
        const { data, error } = await sb.from("pros")
          .select("id, is_active, deleted_at")
          .gte("founding_date", "1900-01-01").lt("founding_date", "1900-01-02")
          .gte("id", a).lt("id", b).range(offset, offset + 999)
          .abortSignal(AbortSignal.timeout(150_000));
        if (error) { await dodo(3000 * essai); continue; }
        rows = data || [];
      }
      if (rows === null) { console.log(`\nBANDE ${a} ABANDONNEE`); break; }
      if (rows.length === 0) { ok = true; break; }
      for (const r of rows) {
        total++;
        if (r.is_active && !r.deleted_at) actifsPartiel++;
        if (r.id >= DEBUT_ID) duRun++;
      }
      offset += rows.length;
    }
    process.stdout.write(`\r  jusqu'a l'id ${b} : ${total} lignes   `);
  }
  console.log(`\nfounding_date = 1900-01-01 : ${total} lignes au total`);
  console.log(`  creees par le run du 05/09 (id >= ${DEBUT_ID}) : ${duRun}`);
  console.log(`  (actives comptees seulement sur la partie ${DEPART}+ : ${actifsPartiel})`);
})();
