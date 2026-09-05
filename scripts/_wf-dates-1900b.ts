import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function cnt(label: string, borne: string) {
  for (let i = 1; i <= 4; i++) {
    const t0 = Date.now();
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .lt("founding_date", borne).abortSignal(AbortSignal.timeout(200_000));
    if (!error && count != null) { console.log(`${label} : ${count}  (${((Date.now()-t0)/1000).toFixed(1)} s)`); return count; }
    console.log(`  essai ${i} echoue (${error?.message || "count null"})`);
    await new Promise(r => setTimeout(r, 4000));
  }
  return null;
}

(async () => {
  const a = await cnt("founding_date < 1900-01-01", "1900-01-01");
  const b = await cnt("founding_date < 1900-01-02", "1900-01-02");
  const c = await cnt("founding_date < 1901-01-01", "1901-01-01");
  if (a != null && b != null) console.log(`\n=> founding_date == 1900-01-01 : ${b - a}`);
  if (b != null && c != null) console.log(`=> founding_date en 1900 hors 1er janvier : ${c - b}`);
  // Quelques exemples concrets a 1900-01-01, sans ORDER BY (qui fait exploser le plan).
  const { data, error } = await sb.from("pros")
    .select("id, slug, name, siret, founding_date, founded_year, is_active, deleted_at, source, created_at, city_id")
    .gte("founding_date", "1900-01-01").lt("founding_date", "1900-01-02").limit(15)
    .abortSignal(AbortSignal.timeout(200_000));
  if (error) console.log("exemples : erreur", error.message);
  else for (const r of data || []) console.log(`  /artisan/${r.slug} | ${r.name} | founded_year=${r.founded_year} | actif=${r.is_active && !r.deleted_at} | source=${r.source} | cree ${String(r.created_at).slice(0,10)}`);
})();
