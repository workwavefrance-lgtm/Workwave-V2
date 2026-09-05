/**
 * Harvest ciblé : électriciens autour de Châtillon-sur-Seine (Côte-d'Or, dept 21)
 * via Apify Google Maps (compass/crawler-google-places) → table `prospects`.
 *
 * Déclenché par un vrai lead (Mohamed, électricien Châtillon-sur-Seine, déposé 07/06).
 * Garde-fous : mobiles 06/07 uniquement, filtre code postal "21" (vrais dept 21),
 * dédup interne + vs prospects existants (upsert onConflict phone). Idempotent.
 *
 *   npx tsx scripts/_harvest-chatillon-elec.ts            # DRY-RUN (montre les numéros, n'écrit rien)
 *   npx tsx scripts/_harvest-chatillon-elec.ts --execute  # insère dans prospects
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local" });

const APIFY_TOKEN = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN || "";
const APIFY_ACTOR = "compass/crawler-google-places";
const APIFY_BASE = "https://api.apify.com/v2";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const EXECUTE = process.argv.includes("--execute");
const DRY = !EXECUTE;
const DEPT = "21";
const CAT_SLUG = "electricien";
const QUERIES = [
  "électricien Châtillon-sur-Seine",
  "électricien Montbard",
  "électricien Laignes",
  "électricien Recey-sur-Ource",
  "électricien Aignay-le-Duc",
  "électricien Vénarey-les-Laumes",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function normMobile(s: string | null): string | null {
  const d = (s || "").replace(/\D/g, "").replace(/^33/, "0");
  return /^0[67]\d{8}$/.test(d) ? d : null;
}

async function runApify(queries: string[]) {
  const start = await fetch(`${APIFY_BASE}/acts/${encodeURIComponent(APIFY_ACTOR)}/runs?token=${APIFY_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      searchStringsArray: queries, maxCrawledPlacesPerSearch: 20, language: "fr", countryCode: "fr",
      categoryFilterMode: "no_filter", includeWebResults: false, maxImages: 0, maxReviews: 0,
      scrapeDirectories: false, deeperCityScrape: false, onePerQuery: false,
    }),
  });
  if (!start.ok) throw new Error(`Apify start ${start.status}: ${(await start.text()).slice(0, 160)}`);
  const rd = await start.json();
  const runId = rd.data.id, dsId = rd.data.defaultDatasetId;
  console.log(`  run ${runId}`);
  let status = rd.data.status, n = 0;
  while (!["SUCCEEDED", "FAILED", "ABORTED"].includes(status)) {
    await sleep(10000); n++;
    if (n % 3 === 0) console.log(`  ... en cours (${Math.round((n * 10) / 60)} min)`);
    status = (await (await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`)).json()).data.status;
  }
  if (status !== "SUCCEEDED") throw new Error(`Apify run ${status}`);
  const runInfo = (await (await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`)).json()).data;
  const cost = runInfo?.usageTotalUsd ?? runInfo?.stats?.costUsd ?? null;
  const items: any[] = [];
  let off = 0;
  while (true) {
    const it = await (await fetch(`${APIFY_BASE}/datasets/${dsId}/items?token=${APIFY_TOKEN}&offset=${off}&limit=1000&format=json`)).json();
    if (!Array.isArray(it) || !it.length) break;
    items.push(...it); off += it.length; if (it.length < 1000) break;
  }
  return { items, cost };
}

async function main() {
  console.log(`\n=== HARVEST Châtillon électriciens (dept ${DEPT}) · ${DRY ? "DRY-RUN" : "EXECUTE"} ===\n`);
  console.log("Requêtes :", QUERIES.join(" · "), "\n");
  const { items, cost } = await runApify(QUERIES);
  console.log(`${items.length} résultats Google Maps · coût ~$${cost != null ? Number(cost).toFixed(4) : "?"}\n`);

  const seen = new Set<string>();
  const harvested = items
    .map((it: any) => ({
      name: (it.title || it.name || "").trim(),
      phone: normMobile(it.phone ?? it.phoneUnformatted ?? null),
      city: (it.city || "").trim(),
      postal: (it.postalCode || "").trim(),
    }))
    .filter((r) => r.name && r.phone)
    .filter((r) => r.postal.startsWith("21")) // vrais Côte-d'Or uniquement
    .filter((r) => { if (seen.has(r.phone!)) return false; seen.add(r.phone!); return true; });

  console.log(`→ ${harvested.length} électriciens avec MOBILE (06/07) en Côte-d'Or (21) :\n`);
  harvested.forEach((r, i) => console.log(`  ${String(i + 1).padStart(2)}. ${r.name.slice(0, 36).padEnd(36)} ${r.phone}  ${r.city} (${r.postal})`));

  if (DRY) {
    console.log(`\n[DRY-RUN] --execute pour insérer ${harvested.length} prospects (cat=electricien, dept=21). AUCUN SMS envoyé.`);
    return;
  }

  const { data: cat } = await sb.from("categories").select("id").eq("slug", CAT_SLUG).single();
  const rows = harvested.map((r) => ({
    name: r.name, category_slug: CAT_SLUG, category_id: (cat as any)?.id ?? null,
    city: r.city, department_code: DEPT, phone: r.phone, source: "google_maps",
  }));
  const { error, count } = await sb.from("prospects").upsert(rows, { onConflict: "phone", ignoreDuplicates: true, count: "exact" });
  if (error) console.error("❌", error.message);
  else console.log(`\n✓ ${count ?? rows.length} prospects insérés (électricien, dept 21). Lance ensuite le dry-run SMS : recruit-prospects.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
