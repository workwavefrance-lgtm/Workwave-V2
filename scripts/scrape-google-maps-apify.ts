/**
 * Enrichissement des pros Workwave via Google Maps (Apify).
 *
 * Strategie : rechercher par "categorie + ville" sur Google Maps via l'actor
 * Apify compass/crawler-google-places, puis matcher les resultats avec nos pros
 * en base pour extraire emails, telephones, notes, etc.
 *
 * Usage :
 *   npx tsx scripts/scrape-google-maps-apify.ts                  # toutes les combos
 *   npx tsx scripts/scrape-google-maps-apify.ts --limit 10       # 10 premieres combos
 *   npx tsx scripts/scrape-google-maps-apify.ts --dry-run        # affiche sans lancer
 *   npx tsx scripts/scrape-google-maps-apify.ts --city Poitiers  # une seule ville
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env.local" });

const APIFY_TOKEN = process.env.APIFY_API_TOKEN || process.env.APIFY_API_KEY;
if (!APIFY_TOKEN) throw new Error("APIFY_API_TOKEN absente de .env.local");
const APIFY_ACTOR = "compass/crawler-google-places";
const APIFY_BASE = "https://api.apify.com/v2";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- Types ---

interface GooglePlaceResult {
  title: string;
  address: string;
  phone: string | null;
  website: string | null;
  categoryName: string;
  totalScore: number | null;
  reviewsCount: number;
  openingHours: unknown[];
  location: { lat: number; lng: number } | null;
  emails?: string[];
  email?: string;
  url: string;
  placeId: string;
}

interface ProRow {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city_name: string;
  category_name: string;
  // Google Maps data
  gm_name: string | null;
  gm_address: string | null;
  gm_phone: string | null;
  gm_email: string | null;
  gm_note: number | null;
  gm_nb_avis: number | null;
  gm_horaires: string | null;
  gm_website: string | null;
  gm_lat: number | null;
  gm_lng: number | null;
  gm_url: string | null;
  score: number | null;
  matched: boolean;
}

// --- Helpers ---

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function similarity(a: string, b: string): number {
  const na = normalizeStr(a);
  const nb = normalizeStr(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;

  const wordsA = na.split(/\s+/);
  const wordsB = nb.split(/\s+/);
  const commonWords = wordsA.filter((w) => wordsB.includes(w));
  const totalWords = Math.max(wordsA.length, wordsB.length);
  return commonWords.length / totalWords;
}

function computeScore(noteGoogle: number | null, nbAvis: number | null): number | null {
  if (noteGoogle === null || nbAvis === null) return null;
  return noteGoogle * 20 + Math.log10((nbAvis || 0) + 1) * 10;
}

// --- Apify API ---

async function runApifyActor(searchQueries: string[]): Promise<GooglePlaceResult[]> {
  console.log(`  Lancement Apify avec ${searchQueries.length} requetes...`);

  // Start the actor run
  const startRes = await fetch(
    `${APIFY_BASE}/acts/${encodeURIComponent(APIFY_ACTOR)}/runs?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchStringsArray: searchQueries,
        maxCrawledPlacesPerSearch: 20,
        language: "fr",
        countryCode: "fr",
        categoryFilterMode: "no_filter",
        includeWebResults: false,
        maxImages: 0,
        maxReviews: 0,
        scrapeDirectories: false,
        deeperCityScrape: false,
        onePerQuery: false,
      }),
    }
  );

  if (!startRes.ok) {
    const errText = await startRes.text();
    throw new Error(`Apify start failed (${startRes.status}): ${errText}`);
  }

  const runData = await startRes.json();
  const runId = runData.data.id;
  console.log(`  Run ID: ${runId}`);

  // Poll until finished
  let status = runData.data.status;
  let pollCount = 0;
  while (status !== "SUCCEEDED" && status !== "FAILED" && status !== "ABORTED") {
    await sleep(10000); // 10s between polls
    pollCount++;
    if (pollCount % 6 === 0) {
      console.log(`  ... en cours (${Math.round(pollCount * 10 / 60)} min)...`);
    }

    const pollRes = await fetch(
      `${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );
    const pollData = await pollRes.json();
    status = pollData.data.status;
  }

  if (status !== "SUCCEEDED") {
    throw new Error(`Apify run failed with status: ${status}`);
  }

  console.log(`  Run terminee avec succes.`);

  // Get results
  const datasetId = runData.data.defaultDatasetId;
  const results: GooglePlaceResult[] = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const dataRes = await fetch(
      `${APIFY_BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&offset=${offset}&limit=${pageSize}&format=json`
    );
    const items = await dataRes.json();
    if (!Array.isArray(items) || items.length === 0) break;
    results.push(...items);
    offset += items.length;
    if (items.length < pageSize) break;
  }

  console.log(`  ${results.length} resultats Google Maps recuperes.`);
  return results;
}

async function getApifyRunCost(runId: string): Promise<number> {
  try {
    const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`);
    const data = await res.json();
    return data.data?.stats?.computeUnits || 0;
  } catch {
    return 0;
  }
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const cityIdx = args.indexOf("--city");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 0;
  const cityFilter = cityIdx >= 0 ? args[cityIdx + 1] : null;
  const dryRun = args.includes("--dry-run");
  const updateDb = args.includes("--update-db");

  console.log("=== Scraping Google Maps via Apify ===");
  console.log(`Actor: ${APIFY_ACTOR}`);
  if (dryRun) console.log("[DRY RUN] Aucun scraping ne sera lance.");
  if (limit) console.log(`Limite: ${limit} combinaisons`);
  if (cityFilter) console.log(`Filtre ville: ${cityFilter}`);
  if (updateDb) console.log("[UPDATE DB] Les resultats seront mis a jour en base.");

  // 1. Charger les pros sans email avec leur ville et categorie
  console.log("\n1. Chargement des pros...");

  // Fetch all pros (paginate because Supabase returns max 1000)
  const allPros: {
    id: number;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    city_id: number;
    category_id: number;
  }[] = [];

  let from = 0;
  const pageSize = 1000;
  while (true) {
    let query = supabase
      .from("pros")
      .select("id, name, slug, address, phone, email, website, city_id, category_id")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    const { data, error } = await query;
    if (error) {
      console.error("Erreur chargement pros:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    allPros.push(...data);
    from += data.length;
    if (data.length < pageSize) break;
  }

  console.log(`  ${allPros.length} pros charges.`);

  // 2. Charger villes et categories
  const cityIds = [...new Set(allPros.map((p) => p.city_id).filter(Boolean))];
  const catIds = [...new Set(allPros.map((p) => p.category_id).filter(Boolean))];

  const { data: cities } = await supabase.from("cities").select("id, name").in("id", cityIds);
  const { data: categories } = await supabase.from("categories").select("id, name").in("id", catIds);

  const cityMap = new Map<number, string>((cities || []).map((c: { id: number; name: string }) => [c.id, c.name]));
  const catMap = new Map<number, string>((categories || []).map((c: { id: number; name: string }) => [c.id, c.name]));

  // 3. Construire les requetes de recherche par categorie + ville
  console.log("\n2. Construction des requetes de recherche...");

  const combos = new Map<string, { categoryName: string; cityName: string; proIds: number[] }>();

  for (const pro of allPros) {
    const cityName = cityMap.get(pro.city_id) || "";
    const catName = catMap.get(pro.category_id) || "";
    if (!cityName || !catName) continue;

    if (cityFilter && normalizeStr(cityName) !== normalizeStr(cityFilter)) continue;

    const key = `${pro.category_id}-${pro.city_id}`;
    if (!combos.has(key)) {
      combos.set(key, { categoryName: catName, cityName, proIds: [] });
    }
    combos.get(key)!.proIds.push(pro.id);
  }

  let comboList = [...combos.values()];
  // Trier par nombre de pros decroissant (villes avec le plus de pros en premier)
  comboList.sort((a, b) => b.proIds.length - a.proIds.length);

  if (limit > 0) {
    comboList = comboList.slice(0, limit);
  }

  const searchQueries = comboList.map(
    (c) => `${c.categoryName} ${c.cityName}, Vienne, France`
  );

  console.log(`  ${comboList.length} combinaisons categorie+ville`);
  console.log(`  Exemples:`);
  searchQueries.slice(0, 5).forEach((q) => console.log(`    - "${q}"`));
  if (searchQueries.length > 5) console.log(`    ... et ${searchQueries.length - 5} autres`);

  // Estimation cout
  const estimatedCost = searchQueries.length * 0.025; // ~$0.025 par recherche
  console.log(`\n  Cout Apify estime: ~$${estimatedCost.toFixed(2)} (${searchQueries.length} recherches)`);

  if (dryRun) {
    console.log("\n[DRY RUN] Arret ici. Relancez sans --dry-run pour scraper.");
    return;
  }

  // 4. Lancer le scraping Apify par batch
  console.log("\n3. Lancement du scraping Apify...");

  const BATCH_SIZE = 50; // 50 requetes par run Apify pour eviter les timeouts
  const allResults: GooglePlaceResult[] = [];
  let totalCU = 0;

  for (let i = 0; i < searchQueries.length; i += BATCH_SIZE) {
    const batch = searchQueries.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(searchQueries.length / BATCH_SIZE);
    console.log(`\n  Batch ${batchNum}/${totalBatches} (${batch.length} requetes)`);

    try {
      const results = await runApifyActor(batch);
      allResults.push(...results);

      // Petit delai entre les batches
      if (i + BATCH_SIZE < searchQueries.length) {
        console.log("  Pause 5s avant le batch suivant...");
        await sleep(5000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERREUR batch ${batchNum}: ${msg}`);
      console.log("  On continue avec les batches suivants...");
    }
  }

  console.log(`\n4. Total resultats Google Maps: ${allResults.length}`);

  // 5. Matcher les resultats avec nos pros
  console.log("\n5. Matching des resultats avec les pros en base...");

  const proMap = new Map(allPros.map((p) => [p.id, p]));
  const rows: ProRow[] = [];
  let matched = 0;
  let unmatched = 0;
  let emailsFound = 0;

  // Index des pros par ville pour le matching
  const prosByCityCategory = new Map<string, typeof allPros>();
  for (const pro of allPros) {
    const cityName = cityMap.get(pro.city_id) || "";
    const catName = catMap.get(pro.category_id) || "";
    const key = normalizeStr(cityName);
    if (!prosByCityCategory.has(key)) {
      prosByCityCategory.set(key, []);
    }
    prosByCityCategory.get(key)!.push(pro);
  }

  // Pour chaque resultat Google Maps, trouver le pro le plus proche
  const matchedProIds = new Set<number>();

  for (const gm of allResults) {
    if (!gm.title) continue;

    // Trouver la ville dans l'adresse Google Maps
    const gmAddress = gm.address || "";

    // Chercher le pro le plus similaire
    let bestMatch: (typeof allPros)[0] | null = null;
    let bestScore = 0;

    for (const pro of allPros) {
      if (matchedProIds.has(pro.id)) continue;

      const sim = similarity(pro.name, gm.title);
      if (sim > bestScore && sim >= 0.5) {
        // Verifier aussi la ville
        const proCity = cityMap.get(pro.city_id) || "";
        if (gmAddress.toLowerCase().includes(proCity.toLowerCase().slice(0, 5)) || sim > 0.8) {
          bestScore = sim;
          bestMatch = pro;
        }
      }
    }

    const gmEmail = gm.email || (gm.emails && gm.emails.length > 0 ? gm.emails[0] : null);
    const score = computeScore(gm.totalScore, gm.reviewsCount);

    if (bestMatch) {
      matched++;
      matchedProIds.add(bestMatch.id);
      if (gmEmail) emailsFound++;

      rows.push({
        id: bestMatch.id,
        name: bestMatch.name,
        slug: bestMatch.slug,
        address: bestMatch.address,
        phone: bestMatch.phone,
        email: bestMatch.email,
        website: bestMatch.website,
        city_name: cityMap.get(bestMatch.city_id) || "",
        category_name: catMap.get(bestMatch.category_id) || "",
        gm_name: gm.title,
        gm_address: gm.address,
        gm_phone: gm.phone,
        gm_email: gmEmail,
        gm_note: gm.totalScore,
        gm_nb_avis: gm.reviewsCount,
        gm_horaires: gm.openingHours ? JSON.stringify(gm.openingHours) : null,
        gm_website: gm.website,
        gm_lat: gm.location?.lat || null,
        gm_lng: gm.location?.lng || null,
        gm_url: gm.url,
        score,
        matched: true,
      });
    } else {
      unmatched++;
      // Ajouter quand meme le resultat Google Maps non-matche
      rows.push({
        id: 0,
        name: "",
        slug: "",
        address: null,
        phone: null,
        email: null,
        website: null,
        city_name: "",
        category_name: "",
        gm_name: gm.title,
        gm_address: gm.address,
        gm_phone: gm.phone,
        gm_email: gmEmail,
        gm_note: gm.totalScore,
        gm_nb_avis: gm.reviewsCount,
        gm_horaires: gm.openingHours ? JSON.stringify(gm.openingHours) : null,
        gm_website: gm.website,
        gm_lat: gm.location?.lat || null,
        gm_lng: gm.location?.lng || null,
        gm_url: gm.url,
        score,
        matched: false,
      });
    }
  }

  console.log(`  Matches: ${matched}`);
  console.log(`  Non-matches: ${unmatched}`);
  console.log(`  Emails trouves: ${emailsFound}`);

  // 6. Mettre a jour la base si demande
  if (updateDb && emailsFound > 0) {
    console.log("\n6. Mise a jour de la base...");
    let updated = 0;
    for (const row of rows) {
      if (!row.matched || !row.id || !row.gm_email) continue;
      const pro = proMap.get(row.id);
      if (!pro || pro.email) continue; // skip si deja un email

      const updates: Record<string, unknown> = { email: row.gm_email };
      if (row.gm_phone && !pro.phone) updates.phone = row.gm_phone;
      if (row.gm_website && !pro.website) updates.website = row.gm_website;

      const { error } = await supabase.from("pros").update(updates).eq("id", row.id);
      if (!error) updated++;
    }
    console.log(`  ${updated} pros mis a jour en base.`);
  }

  // 7. Generer le fichier Excel
  console.log("\n7. Generation du fichier Excel...");

  // Trier par score decroissant
  rows.sort((a, b) => (b.score || 0) - (a.score || 0));

  const wsData = rows.map((r) => ({
    "ID Workwave": r.id || "",
    "Nom Workwave": r.name,
    "Ville": r.city_name,
    "Categorie": r.category_name,
    "Email actuel": r.email || "",
    "Telephone actuel": r.phone || "",
    "Site web actuel": r.website || "",
    "--- Google Maps ---": "",
    "Nom Google Maps": r.gm_name || "",
    "Adresse Google Maps": r.gm_address || "",
    "Telephone Google Maps": r.gm_phone || "",
    "Email Google Maps": r.gm_email || "",
    "Note Google": r.gm_note || "",
    "Nombre d'avis": r.gm_nb_avis || "",
    "Site web Google Maps": r.gm_website || "",
    "Latitude": r.gm_lat || "",
    "Longitude": r.gm_lng || "",
    "URL Google Maps": r.gm_url || "",
    "Horaires": r.gm_horaires || "",
    "Score": r.score !== null ? r.score.toFixed(1) : "",
    "Match": r.matched ? "OUI" : "NON",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(wsData);

  // Largeurs de colonnes
  ws["!cols"] = [
    { wch: 12 }, { wch: 35 }, { wch: 20 }, { wch: 20 },
    { wch: 30 }, { wch: 15 }, { wch: 30 },
    { wch: 3 },
    { wch: 35 }, { wch: 40 }, { wch: 15 }, { wch: 30 },
    { wch: 8 }, { wch: 12 }, { wch: 30 },
    { wch: 10 }, { wch: 10 }, { wch: 40 }, { wch: 50 },
    { wch: 8 }, { wch: 6 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Pros Google Maps");

  const xlsxPath = path.join(process.cwd(), "pros_google_maps.xlsx");
  XLSX.writeFile(wb, xlsxPath);
  console.log(`  Fichier: ${xlsxPath}`);

  // 8. Generer le fichier de couts
  const costsPath = path.join(process.cwd(), "couts_apify.md");
  const costsContent = `# Couts Apify - Scraping Google Maps

Date: ${new Date().toLocaleDateString("fr-FR")}

## Resume
- Actor: ${APIFY_ACTOR}
- Requetes envoyees: ${searchQueries.length}
- Resultats recus: ${allResults.length}
- Pros matches: ${matched}
- Emails trouves: ${emailsFound}

## Estimation
- Cout par recherche: ~$0.025
- Cout total estime: ~$${estimatedCost.toFixed(2)}

## Fichiers produits
1. \`pros_google_maps.xlsx\` : ${rows.length} lignes, avec score et matching
2. \`couts_apify.md\` : ce fichier

## Formule du score
\`score = (note_google × 20) + (log10(nb_avis + 1) × 10)\`
`;

  fs.writeFileSync(costsPath, costsContent);
  console.log(`  Fichier: ${costsPath}`);

  // Resume final
  console.log("\n=== Resume ===");
  console.log(`Recherches Google Maps : ${searchQueries.length}`);
  console.log(`Resultats recus        : ${allResults.length}`);
  console.log(`Pros matches           : ${matched}`);
  console.log(`Non-matches            : ${unmatched}`);
  console.log(`Emails trouves         : ${emailsFound}`);
  console.log(`\nFichiers produits :`);
  console.log(`  1. ${xlsxPath}`);
  console.log(`  2. ${costsPath}`);
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
