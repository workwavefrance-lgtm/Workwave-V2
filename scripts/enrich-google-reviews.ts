/**
 * Enrichit les fiches pro avec NOTE + NB D'AVIS Google (+ place_id), via Apify
 * `compass/crawler-google-places`. RÈGLE CLAUDE.md : vraie donnée, zéro mélange.
 *
 * SÉCURITÉ ANTI-MÉLANGE (leçon RGPD 01/05) :
 *  - recherche par NOM EXACT du pro + ville (pas par catégorie large),
 *  - 1 résultat par requête (onePerQuery),
 *  - VALIDATEUR STRICT : on n'attribue QUE si le nom Google recoupe fortement le
 *    nom SIRENE (≥50% des tokens significatifs) ET la ville correspond.
 *  - On ne récupère NI les textes d'avis (copyright/ToS) NI email/téléphone — juste
 *    note (totalScore), nb d'avis (reviewsCount), placeId.
 *
 *   npx tsx scripts/enrich-google-reviews.ts --ville poitiers --limit 15           # test (mesure coût + matching)
 *   npx tsx scripts/enrich-google-reviews.ts --ville poitiers --limit 15 --apply   # écrit en base
 *   npx tsx scripts/enrich-google-reviews.ts --ville bordeaux --apply --max-cost 1 # ville entière, plafond $1
 */
import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const TOKEN = process.env.APIFY_API_TOKEN;
if (!TOKEN) { console.error("❌ APIFY_API_TOKEN manquant dans .env.local"); process.exit(1); }
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const ACTOR = "compass/crawler-google-places";
const BASE = "https://api.apify.com/v2";

const argv = process.argv.slice(2);
const arg = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
const APPLY = argv.includes("--apply");
const VILLE = arg("--ville");
const DEPT = arg("--dept");
const LIMIT = arg("--limit") ? parseInt(arg("--limit")!, 10) : APPLY ? 0 : 15;
const MAX_COST = arg("--max-cost") ? parseFloat(arg("--max-cost")!) : 4.0; // garde-fou budget $

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const deburr = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const STOP = new Set(["sarl", "sas", "sasu", "eurl", "ei", "earl", "sci", "ets", "etablissements", "entreprise", "societe", "monsieur", "madame", "mr", "mme", "et", "de", "du", "des", "la", "le", "les", "pour", "chez"]);
const toks = (s: string) => deburr(s).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w));

/** VALIDATEUR STRICT : nom Google recoupe le nom SIRENE + ville cohérente. */
function isStrongMatch(ourName: string, ourCity: string, gName: string, gAddress: string): boolean {
  const a = toks(ourName);
  if (a.length === 0) return false;
  const b = new Set(toks(gName));
  const overlap = a.filter((w) => b.has(w)).length;
  if (overlap < 1 || overlap / a.length < 0.5) return false; // ≥50% des tokens de NOTRE nom
  // ville : la commune doit apparaître dans l'adresse Google (ou inversement)
  const c = deburr(ourCity).replace(/[^a-z0-9]/g, "");
  const g = deburr(gAddress).replace(/[^a-z0-9]/g, "");
  return c.length > 0 && (g.includes(c) || c.includes(g.slice(0, Math.max(4, c.length))));
}

type Pro = { id: number; slug: string; name: string; city_id: number | null; city?: { name: string } | null };

async function loadAll<T>(table: string, cols: string, f: (q: any) => any): Promise<T[]> {
  const PAGE = 1000; let off = 0; const all: T[] = [];
  while (true) {
    const { data, error } = await f(sb.from(table).select(cols)).range(off, off + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const rows = (data || []) as T[];
    if (rows.length === 0) break;
    all.push(...rows); off += rows.length;
  }
  return all;
}

async function targetCityIds(): Promise<{ ids: number[]; nameById: Map<number, string> } | null> {
  let cities: { id: number; name: string }[] = [];
  if (VILLE) {
    const { data } = await sb.from("cities").select("id, name").ilike("slug", VILLE);
    cities = (data || []) as any;
  } else if (DEPT) {
    const { data: d } = await sb.from("departments").select("id").eq("code", DEPT.toUpperCase()).single();
    if (!d) throw new Error(`dept ${DEPT} introuvable`);
    cities = await loadAll<{ id: number; name: string }>("cities", "id, name", (q) => q.eq("department_id", (d as any).id));
  } else return null;
  return { ids: cities.map((c) => c.id), nameById: new Map(cities.map((c) => [c.id, c.name])) };
}

async function runActor(queries: string[]): Promise<{ items: any[]; runId: string }> {
  const start = await fetch(`${BASE}/acts/${encodeURIComponent(ACTOR)}/runs?token=${TOKEN}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      searchStringsArray: queries,
      maxCrawledPlacesPerSearch: 1, onePerQuery: true,
      language: "fr", countryCode: "fr",
      maxReviews: 0, maxImages: 0, includeWebResults: false, scrapeDirectories: false, deeperCityScrape: false,
    }),
  });
  if (!start.ok) throw new Error(`Apify start ${start.status}: ${await start.text()}`);
  const run = (await start.json()).data; const runId = run.id;
  let status = run.status, poll = 0;
  while (!["SUCCEEDED", "FAILED", "ABORTED"].includes(status)) {
    await sleep(8000); poll++;
    if (poll % 8 === 0) console.log(`    … run en cours (${Math.round(poll * 8 / 60)} min)`);
    status = (await (await fetch(`${BASE}/actor-runs/${runId}?token=${TOKEN}`)).json()).data.status;
  }
  if (status !== "SUCCEEDED") throw new Error(`Apify run ${status}`);
  const dsId = run.defaultDatasetId; const items: any[] = []; let off = 0;
  while (true) {
    const it = await (await fetch(`${BASE}/datasets/${dsId}/items?token=${TOKEN}&offset=${off}&limit=1000&format=json`)).json();
    if (!Array.isArray(it) || it.length === 0) break;
    items.push(...it); off += it.length; if (it.length < 1000) break;
  }
  return { items, runId };
}

async function runCost(runId: string): Promise<number> {
  try {
    const r = await (await fetch(`${BASE}/actor-runs/${runId}?token=${TOKEN}`)).json();
    return r?.data?.usageTotalUsd ?? r?.data?.stats?.computeUnits ?? 0;
  } catch { return 0; }
}

async function main() {
  const scope = await targetCityIds();
  if (!scope) { console.error("Préciser --ville <slug> ou --dept <code>"); process.exit(1); }
  console.log(`Enrich avis Google · ${VILLE || "dept " + DEPT} · ${APPLY ? "APPLY" : "DRY"} · plafond $${MAX_COST}\n`);

  const pros = await loadAll<Pro>("pros", "id, slug, name, city_id", (q) =>
    q.eq("is_active", true).is("deleted_at", null).is("google_rating", null).in("city_id", scope.ids)
  );
  const todo = LIMIT > 0 ? pros.slice(0, LIMIT) : pros;
  console.log(`${pros.length} pros sans note Google dans le scope · traite ${todo.length}`);
  if (todo.length === 0) return;

  // 1 requête par pro : "NOM, VILLE"
  const queries = todo.map((p) => `${p.name}, ${scope.nameById.get(p.city_id!) || ""}`.trim());
  console.log(`Lancement Apify (${queries.length} requêtes, ~$${(queries.length / 1000).toFixed(3)} estimé)…`);
  const { items, runId } = await runActor(queries);
  const cost = await runCost(runId);
  console.log(`${items.length} résultats Google · coût réel run = $${cost.toFixed(4)}\n`);
  if (cost > MAX_COST) console.log(`⚠️ coût ($${cost.toFixed(2)}) > plafond ($${MAX_COST}) — on n'écrit pas, vérifie.`);

  // index résultats par nom normalisé pour matcher
  let matched = 0, rejected = 0;
  for (const p of todo) {
    const cityName = scope.nameById.get(p.city_id!) || "";
    // trouver le 1er résultat qui passe le validateur strict
    const hit = items.find((it) => {
      const gName = it.title || it.name || "";
      const gAddr = it.address || it.street || "";
      const totalScore = it.totalScore ?? it.rating ?? null;
      return totalScore != null && isStrongMatch(p.name, cityName, gName, gAddr);
    });
    if (!hit) { rejected++; continue; }
    const rating = hit.totalScore ?? hit.rating;
    const count = hit.reviewsCount ?? hit.reviewsCountText ?? 0;
    const placeId = hit.placeId || hit.place_id || null;
    matched++;
    if (!APPLY) {
      console.log(`  ✓ ${p.name.slice(0, 30).padEnd(30)} → ${rating}★ (${count} avis) · «${hit.title}»`);
      continue;
    }
    if (cost > MAX_COST) continue;
    const { error } = await sb.from("pros").update({
      google_rating: rating, google_reviews_count: count, google_place_id: placeId,
    }).eq("id", p.id);
    if (error) console.log(`  ✗ ${p.slug}: ${error.message}`);
  }
  console.log(`\n${APPLY ? "✅ MAJ" : "DRY"} : ${matched} matchés (validés) · ${rejected} rejetés (pas de match strict) · coût $${cost.toFixed(4)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
