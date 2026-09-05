/**
 * Import des notes Google déjà scrapées sur Apify (datasets existants) vers la
 * table `pros`. Le scrape est DÉJÀ payé → cet import est gratuit (lecture des
 * datasets via l'API Apify, aucun nouveau run).
 *
 * Matching STRICT (anti-mélange RGPD, cf. leçon 01/05) :
 *   - même VILLE (nom normalisé) que le pro
 *   - recouvrement fort des tokens du NOM (Jaccard >= 0.6 OU sous-ensemble)
 *   - match UNIQUE (si 0 ou >1 pro candidat → REJET, on préfère rater qu'attribuer faux)
 *   - on n'écrase JAMAIS une note existante (google_rating null seulement)
 *
 * Dry-run par défaut. Écriture réelle avec --apply.
 *   npx tsx scripts/_import-apify-google-ratings.ts          # dry-run
 *   npx tsx scripts/_import-apify-google-ratings.ts --apply  # écrit en base
 */
import * as dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const APPLY = process.argv.includes("--apply");
const TOKEN = (process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN || "").trim();
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const ACTOR = "compass~crawler-google-places";

const STOP = new Set(["sarl","sas","sasu","eurl","ei","eirl","sa","sci","scop","snc","ets","etablissements","entreprise","ste","societe","monsieur","madame","mme","sarlu","selarl","and","the"]);

function norm(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function tokens(s: string): Set<string> {
  return new Set(norm(s).split(" ").filter((t) => t.length >= 3 && !STOP.has(t)));
}
function nameMatch(a: string, b: string): boolean {
  const ta = tokens(a), tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return false;
  const common = [...ta].filter((t) => tb.has(t)).length;
  if (common === 0) return false;
  const small = Math.min(ta.size, tb.size);
  const union = new Set([...ta, ...tb]).size;
  // sous-ensemble (tous les tokens du plus petit dans l'autre) OU Jaccard >= 0.6
  return common === small || common / union >= 0.6;
}

async function fetchJson(url: string): Promise<any> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url.split("?")[0]}`);
  return r.json();
}

async function main() {
  if (!TOKEN) { console.error("APIFY token manquant dans .env.local"); process.exit(1); }
  console.log(`Mode : ${APPLY ? "APPLY (écriture)" : "DRY-RUN (aucune écriture)"}\n`);

  // 1) Runs SUCCEEDED récents → datasets
  const runs = await fetchJson(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${TOKEN}&limit=15&desc=true`);
  const dsIds: string[] = [...new Set(
    (runs.data.items as any[]).filter((r) => r.status === "SUCCEEDED").map((r) => r.defaultDatasetId as string)
  )];
  console.log(`Datasets à lire : ${dsIds.length}`);

  // 2) Charger tous les items Google
  const items: { title: string; city: string; rating: number; reviews: number; placeId: string }[] = [];
  for (const ds of dsIds) {
    let offset = 0;
    while (true) {
      const page = await fetchJson(`https://api.apify.com/v2/datasets/${ds}/items?token=${TOKEN}&offset=${offset}&limit=1000&format=json`);
      if (!Array.isArray(page) || page.length === 0) break;
      for (const it of page) {
        const rating = it.totalScore ?? it.rating ?? null;
        if (rating == null) continue;
        items.push({
          title: it.title || it.name || "",
          city: it.city || "",
          rating,
          reviews: it.reviewsCount ?? it.reviews ?? 0,
          placeId: it.placeId || it.place_id || "",
        });
      }
      offset += page.length;
      if (page.length < 1000) break;
    }
  }
  console.log(`Fiches Google avec note : ${items.length}`);

  // 3) Villes concernées → city_ids
  const itemCities = new Set(items.map((i) => norm(i.city)).filter(Boolean));
  const { data: allCities } = await sb.from("cities").select("id, name");
  const cityIdsByName = new Map<string, number[]>();
  for (const c of (allCities || []) as { id: number; name: string }[]) {
    const k = norm(c.name);
    if (!itemCities.has(k)) continue;
    (cityIdsByName.get(k) || cityIdsByName.set(k, []).get(k)!).push(c.id);
  }
  const candidateCityIds = [...new Set([...cityIdsByName.values()].flat())];
  console.log(`Villes matchées : ${cityIdsByName.size} → ${candidateCityIds.length} city_id`);

  // 4) Charger les pros de ces villes (pagination PostgREST 1000)
  const prosByCity = new Map<number, { id: number; name: string; hasRating: boolean }[]>();
  for (let i = 0; i < candidateCityIds.length; i += 200) {
    const slice = candidateCityIds.slice(i, i + 200);
    let offset = 0;
    while (true) {
      const { data } = await sb.from("pros")
        .select("id, name, city_id, google_rating")
        .in("city_id", slice).eq("is_active", true).is("deleted_at", null)
        .range(offset, offset + 999);
      const rows = (data || []) as { id: number; name: string; city_id: number; google_rating: number | null }[];
      if (rows.length === 0) break;
      for (const p of rows) {
        const arr = prosByCity.get(p.city_id) || prosByCity.set(p.city_id, []).get(p.city_id)!;
        arr.push({ id: p.id, name: p.name, hasRating: p.google_rating != null });
      }
      offset += rows.length;
      if (rows.length < 1000) break;
    }
  }
  const totalPros = [...prosByCity.values()].reduce((s, a) => s + a.length, 0);
  console.log(`Pros candidats chargés : ${totalPros}\n`);

  // 5) Matching strict
  let matched = 0, ambiguous = 0, noCandidate = 0, alreadyRated = 0;
  const toWrite: { id: number; rating: number; reviews: number; placeId: string }[] = [];
  const examples: string[] = [];
  for (const it of items) {
    const cityIds = cityIdsByName.get(norm(it.city)) || [];
    const candidates = cityIds.flatMap((cid) => prosByCity.get(cid) || []);
    const hits = candidates.filter((p) => nameMatch(p.name, it.title));
    if (hits.length === 0) { noCandidate++; continue; }
    if (hits.length > 1) { ambiguous++; continue; }
    const pro = hits[0];
    if (pro.hasRating) { alreadyRated++; continue; }
    matched++;
    toWrite.push({ id: pro.id, rating: it.rating, reviews: it.reviews, placeId: it.placeId });
    if (examples.length < 15) examples.push(`  ✓ "${pro.name}" ← "${it.title}" (${it.city}) : ${it.rating}★ (${it.reviews} avis)`);
  }

  console.log("=== RÉSULTAT MATCHING ===");
  console.log(`  ✓ matches uniques fiables : ${matched}`);
  console.log(`  ⚠ ambigus (>1 pro, rejetés) : ${ambiguous}`);
  console.log(`  ⚠ déjà notés (ignorés) : ${alreadyRated}`);
  console.log(`  · sans candidat dans la ville : ${noCandidate}`);
  console.log(`\nExemples de matches :`);
  console.log(examples.join("\n"));

  // 6) Écriture
  if (!APPLY) { console.log(`\n[DRY-RUN] ${matched} pros seraient enrichis. Relance avec --apply pour écrire.`); return; }
  console.log(`\n[APPLY] Écriture de ${matched} notes...`);
  let written = 0;
  for (const w of toWrite) {
    const { error } = await sb.from("pros").update({
      google_rating: w.rating,
      google_reviews_count: w.reviews,
      google_place_id: w.placeId || null,
      google_enriched_at: new Date().toISOString(),
    }).eq("id", w.id);
    if (error) console.error(`  ✗ pro ${w.id}: ${error.message}`);
    else written++;
  }
  console.log(`✓ ${written}/${matched} pros enrichis avec leur note Google.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
