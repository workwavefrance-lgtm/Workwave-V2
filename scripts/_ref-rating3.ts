import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

async function main() {
  const sb = getServiceClient();
  const PAGE = 1000;
  let offset = 0;
  let total = 0, ouverts = 0, avecCount = 0;
  const t0 = Date.now();
  while (true) {
    const { data, error } = await sb
      .from("pros")
      .select("id,google_rating,google_reviews_count,etat_admin,is_active,deleted_at")
      .not("google_rating", "is", null)
      .order("id")
      .range(offset, offset + PAGE - 1)
      .abortSignal(AbortSignal.timeout(120_000));
    if (error) { console.log("ERR", error.message); break; }
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) {
      total++;
      if (r.is_active && !r.deleted_at && r.etat_admin !== "F") ouverts++;
      if ((r.google_reviews_count ?? 0) > 0) avecCount++;
    }
    offset += rows.length;
    if (offset % 10000 === 0) console.log("...", offset, ((Date.now()-t0)/1000).toFixed(0)+"s");
  }
  console.log("TOTAL pros avec google_rating non nul =", total);
  console.log("  dont actifs+ouverts =", ouverts);
  console.log("  dont google_reviews_count > 0 =", avecCount);
  console.log("duree", ((Date.now()-t0)/1000).toFixed(0)+"s");
}
main();
