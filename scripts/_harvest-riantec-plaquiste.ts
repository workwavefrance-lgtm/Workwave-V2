/**
 * Harvest ciblé : plaquistes autour de Riantec (Morbihan, 56) via Apify
 * Google Maps + contacts. Déclenché par le lead #71 : plaquiste, budget >15k (12/06).
 *
 * Sortie : liste mobiles 06/07 (SMS manuel Willy) + emails. En --execute :
 *   1. enrichit les fiches `pros` plaquiste dept 56 matchées en STRICT name
 *      match (leçon RGPD 01/05 : jamais d'attribution sans validation du nom),
 *      uniquement sur les champs NULL (jamais d'écrasement) ;
 *   2. upsert les mobiles dans `prospects` (idempotent, onConflict phone).
 * Ensuite : npx tsx scripts/recruit-pros.ts --project=71 --channel=email
 *
 *   npx tsx scripts/_harvest-riantec-plaquiste.ts            # DRY-RUN (lance Apify, n'écrit rien)
 *   npx tsx scripts/_harvest-riantec-plaquiste.ts --execute  # enrichit pros + insère prospects
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
config({ path: ".env.local", override: true });

const APIFY_TOKEN = process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN || "";
const APIFY_ACTOR = "lukaskrivka/google-maps-with-contact-details";
const APIFY_BASE = "https://api.apify.com/v2";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const EXECUTE = process.argv.includes("--execute");
const DRY = !EXECUTE;
const CACHE = "tracking/harvest-riantec-plaquiste-raw.json"; // évite de payer Apify 2×
const CAT_SLUG = "plaquiste";
const DEPT_CODE = "56";
const RIANTEC = { lat: 47.7208, lng: -3.3029 };
const MAX_KM = 35;
const QUERIES = [
  "plaquiste Riantec",
  "plaquiste Port-Louis",
  "plaquiste Lorient",
  "platrier plaquiste Lorient",
  "plaquiste Lanester",
  "plaquiste Hennebont",
  "plaquiste Ploemeur",
  "plaquiste Languidic",
  "plaquiste Auray",
  "plaquiste Quimperle",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function normMobile(s: string | null | undefined): string | null {
  const d = (s || "").replace(/\D/g, "").replace(/^33/, "0");
  return /^0[67]\d{8}$/.test(d) ? d : null;
}
function normPhone(s: string | null | undefined): string | null {
  const d = (s || "").replace(/\D/g, "").replace(/^33/, "0");
  return /^0[1-9]\d{8}$/.test(d) ? d : null;
}

// ---- strict name match v2 (leçon 01/05 : validateur obligatoire avant attribution) ----
// v1 sortait des faux positifs via tokens génériques (« lorient », « travaux »,
// « deco », « jointoyeur » : 4 entreprises différentes matchées sur ics-lorient-00016).
// v2 : (a) stopwords élargis aux mots de métier/génériques, (b) inclusion totale
// du nom le plus court dans le plus long, (c) au moins un token distinctif commun
// qui ne soit PAS un nom de commune du département (chargés depuis la table cities).
const STOPWORDS = new Set([
  "sarl", "sas", "sasu", "eurl", "scop", "snc", "ets", "etablissements",
  "entreprise", "societe", "monsieur", "madame", "et", "fils", "freres", "le", "la", "les", "de", "du", "des", "den",
  "plaquiste", "plaquistes", "platrerie", "platrier", "platriers", "placo", "plac", "plak", "plaque", "plaques",
  "renovation", "renovations", "renov", "amenagement", "amenagements", "agencement", "agencements",
  "isolation", "menuiserie", "deco", "decoration", "peinture", "travaux", "batiment", "batiments",
  "construction", "constructions", "couverture", "cloison", "cloisons", "plafond", "plafonds",
  "jointoyeur", "jointeur", "bandeur", "enduiseur", "habitat", "maison", "cuisine", "cuisines",
  "expert", "rge", "interieur", "interieure", "exterieur", "exterieure", "services", "service", "multi",
  "facade", "facades", "ker", // facade = métier ; ker = préfixe breton ultra-commun (KER PLAK ≠ KER ECO-LOGIS)
  "bretagne", "morbihan", "breizh", "armor", "oriant", "france", "ouest", "sud", "nord",
]);
// Emails SoLocal/PagesJaunes scrapés par erreur (leçon 01/05 : R.F.DEPANNAGE
// avec satisfactionclient@solocalms.fr), jamais attribuables à une entreprise.
function isJunkEmail(e: string): boolean {
  const dom = e.split("@")[1] || "";
  return dom === "local.fr" || dom.endsWith(".local.fr") || dom.includes("solocal") || dom.includes("pagesjaunes");
}
function tokens(s: string): string[] {
  return s.toLowerCase().normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}
let CITY_TOKENS = new Set<string>(); // rempli dans main() depuis cities dept 56
function strictNameMatch(gmapsName: string, proName: string): boolean {
  const a = tokens(gmapsName), b = tokens(proName);
  if (!a.length || !b.length) return false;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  const setLonger = new Set(longer);
  if (!shorter.every((t) => setLonger.has(t))) return false;
  // au moins un token commun distinctif (pas un nom de commune)
  return shorter.some((t) => !CITY_TOKENS.has(t));
}

async function runApify() {
  if (fs.existsSync(CACHE)) {
    console.log(`(cache ${CACHE} trouvé, pas de nouveau run Apify)`);
    return { items: JSON.parse(fs.readFileSync(CACHE, "utf-8")), cost: null as number | null };
  }
  const start = await fetch(`${APIFY_BASE}/acts/${encodeURIComponent(APIFY_ACTOR)}/runs?token=${APIFY_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      searchStringsArray: QUERIES, maxCrawledPlacesPerSearch: 20, language: "fr", countryCode: "fr",
      scrapeEmails: true, scrapeContactInfo: true, maxImages: 0, maxReviews: 0,
    }),
  });
  if (!start.ok) throw new Error(`Apify start ${start.status}: ${(await start.text()).slice(0, 160)}`);
  const rd = await start.json();
  const runId = rd.data.id, dsId = rd.data.defaultDatasetId;
  console.log(`  run Apify ${runId}...`);
  let status = rd.data.status, n = 0;
  while (!["SUCCEEDED", "FAILED", "ABORTED"].includes(status)) {
    await sleep(10000); n++;
    if (n % 6 === 0) console.log(`  ... en cours (${Math.round((n * 10) / 60)} min)`);
    status = (await (await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`)).json()).data.status;
  }
  if (status !== "SUCCEEDED") throw new Error(`Apify run ${status}`);
  const info = (await (await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`)).json()).data;
  const cost = info?.usageTotalUsd ?? info?.stats?.costUsd ?? null;
  const items: any[] = [];
  let off = 0;
  while (true) {
    const it = await (await fetch(`${APIFY_BASE}/datasets/${dsId}/items?token=${APIFY_TOKEN}&offset=${off}&limit=1000&format=json`)).json();
    if (!Array.isArray(it) || !it.length) break;
    items.push(...it); off += it.length;
  }
  fs.mkdirSync("tracking", { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(items, null, 1));
  return { items, cost };
}

async function main() {
  console.log(`\n=== HARVEST plaquistes secteur Riantec (56) · ${DRY ? "DRY-RUN" : "EXECUTE"} ===\n`);
  const { items, cost } = await runApify();
  console.log(`${items.length} résultats Google Maps · coût ${cost != null ? "~$" + Number(cost).toFixed(2) : "(cache)"}\n`);

  // extraction + filtre distance
  const seen = new Set<string>();
  const harvested = items
    .map((it: any) => {
      const lat = it.location?.lat ?? it.latitude ?? null;
      const lng = it.location?.lng ?? it.longitude ?? null;
      const emails: string[] = (Array.isArray(it.emails) ? it.emails : it.email ? [it.email] : [])
        .filter((e: string) => e && !isJunkEmail(String(e).toLowerCase()));
      return {
        name: String(it.title || it.name || "").trim(),
        phoneRaw: it.phone ?? it.phoneUnformatted ?? null,
        phone: normPhone(it.phone ?? it.phoneUnformatted),
        mobile: normMobile(it.phone ?? it.phoneUnformatted),
        email: (emails[0] || "").toLowerCase().trim() || null,
        website: it.website || null,
        city: String(it.city || "").trim(),
        postal: String(it.postalCode || "").trim(),
        km: lat != null && lng != null ? Math.round(haversineKm(RIANTEC, { lat, lng })) : null,
      };
    })
    .filter((r) => r.name && (r.phone || r.email))
    .filter((r) => (r.km != null ? r.km <= MAX_KM : r.postal.startsWith("56")))
    .filter((r) => {
      const key = r.phone || r.email!;
      if (seen.has(key)) return false; seen.add(key); return true;
    })
    .sort((a, b) => (a.km ?? 999) - (b.km ?? 999));

  console.log(`→ ${harvested.length} plaquistes uniques ≤ ${MAX_KM} km de Riantec\n`);

  // fiches pros plaquiste dept 56 pour le strict match
  const { data: cat } = await sb.from("categories").select("id").eq("slug", CAT_SLUG).single();
  const catId = (cat as any).id;
  const { data: cities } = await sb.from("cities").select("id, name").eq("department_id", 16);
  const cityIds = (cities || []).map((c: any) => c.id);
  // tokens des noms de communes du 56 : exclus du rôle de « token distinctif »
  for (const c of cities || []) {
    for (const t of (c.name as string).toLowerCase().normalize("NFD").replace(/\p{Mn}/gu, "")
      .replace(/[^a-z0-9\s]/g, " ").split(/\s+/)) {
      if (t.length >= 3) CITY_TOKENS.add(t);
    }
  }
  const pros: any[] = [];
  let off = 0;
  while (true) {
    const { data } = await sb.from("pros")
      .select("id, name, slug, email, phone, city_id")
      .or(`category_id.eq.${catId},secondary_category_ids.cs.{${catId}}`)
      .in("city_id", cityIds).eq("is_active", true).is("deleted_at", null)
      .range(off, off + 999);
    const rows = data || [];
    if (rows.length === 0) break;
    pros.push(...rows); off += rows.length;
  }
  console.log(`Fiches pros plaquiste dept 56 en base : ${pros.length}\n`);

  // matching strict
  const matches: Array<{ h: (typeof harvested)[0]; pro: any }> = [];
  for (const h of harvested) {
    const cands = pros.filter((p) => strictNameMatch(h.name, p.name));
    if (cands.length === 1) matches.push({ h, pro: cands[0] });
    else if (cands.length > 1) console.log(`  ⚠️ ambigu (${cands.length} fiches) pour « ${h.name} », skip enrichissement`);
  }

  console.log(`--- LISTE (${harvested.length}) · mobile = SMS possible ---`);
  harvested.forEach((r, i) => {
    const m = matches.find((x) => x.h === r);
    console.log(
      `${String(i + 1).padStart(2)}. ${r.name.slice(0, 34).padEnd(34)} ${(r.mobile || r.phone || "-").padEnd(11)} ${(r.email || "-").slice(0, 32).padEnd(32)} ${String(r.km ?? "?").padStart(3)} km  ${r.city}${m ? "  → fiche " + m.pro.slug : ""}`
    );
  });
  console.log(`\nMatches fiche (strict name) : ${matches.length}/${harvested.length}`);
  console.log(`Mobiles 06/07 : ${harvested.filter((r) => r.mobile).length} · Emails : ${harvested.filter((r) => r.email).length}`);

  if (DRY) {
    console.log(`\n[DRY-RUN] Rien écrit. --execute pour enrichir les fiches matchées (champs NULL only) + insérer prospects.`);
    return;
  }

  // EXECUTE 1 : enrichir les fiches matchées (NULL only, jamais d'écrasement)
  let enriched = 0;
  for (const { h, pro } of matches) {
    const patch: Record<string, string> = {};
    if (!pro.email && h.email) patch.email = h.email;
    if (!pro.phone && (h.mobile || h.phone)) patch.phone = h.mobile || h.phone!;
    if (!Object.keys(patch).length) continue;
    const { error } = await sb.from("pros").update(patch).eq("id", pro.id);
    if (error) console.log(`  ❌ pros#${pro.id} : ${error.message}`);
    else { enriched++; console.log(`  ✓ fiche ${pro.slug} enrichie : ${Object.keys(patch).join("+")}`); }
  }
  console.log(`\n✓ ${enriched} fiches pros enrichies (sur ${matches.length} matches)`);

  // EXECUTE 2 : prospects (mobiles, pour SMS manuel)
  const rows = harvested
    .filter((r) => r.mobile)
    .map((r) => ({
      name: r.name, category_slug: CAT_SLUG, category_id: catId,
      city: r.city, department_code: DEPT_CODE, phone: r.mobile, email: r.email,
      source: "google_maps",
    }));
  const { error, count } = await sb.from("prospects").upsert(rows, { onConflict: "phone", ignoreDuplicates: true, count: "exact" });
  if (error) console.error("❌ prospects :", error.message);
  else console.log(`✓ ${count ?? rows.length} prospects upsertés (plaquiste, secteur 56).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
