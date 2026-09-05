/**
 * Scraping Google Maps Email Extractor via Apify.
 * Actor: lukaskrivka/google-maps-with-contact-details
 *
 * Recherche les pros par categorie + departement sur Google Maps,
 * extrait les emails via les sites web, puis matche avec la base Supabase.
 *
 * Usage :
 *   npx tsx scripts/scrape-gmaps-emails.ts                   # toutes les categories
 *   npx tsx scripts/scrape-gmaps-emails.ts --limit 5          # 5 premieres categories
 *   npx tsx scripts/scrape-gmaps-emails.ts --dry-run          # affiche sans lancer
 *   npx tsx scripts/scrape-gmaps-emails.ts --update-db        # met a jour la base
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env.local" });

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
if (!APIFY_TOKEN) throw new Error("APIFY_API_TOKEN absente de .env.local");
const APIFY_ACTOR = "lukaskrivka/google-maps-with-contact-details";
const APIFY_BASE = "https://api.apify.com/v2";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  const wordsA = na.split(/\s+/).filter((w) => w.length > 2);
  const wordsB = nb.split(/\s+/).filter((w) => w.length > 2);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  const common = wordsA.filter((w) =>
    wordsB.some((wb) => wb.includes(w) || w.includes(wb))
  );
  return common.length / Math.max(wordsA.length, wordsB.length);
}

function computeScore(note: number | null, avis: number | null): number | null {
  if (note === null || avis === null) return null;
  return note * 20 + Math.log10((avis || 0) + 1) * 10;
}

// --- Apify ---

async function startApifyRun(searchQueries: string[]): Promise<string> {
  const res = await fetch(
    `${APIFY_BASE}/acts/${encodeURIComponent(APIFY_ACTOR)}/runs?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchStringsArray: searchQueries,
        maxCrawledPlacesPerSearch: 200,
        language: "fr",
        countryCode: "fr",
        scrapeEmails: true,
        scrapeContactInfo: true,
        maxImages: 0,
        maxReviews: 0,
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Apify start failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.data.id;
}

async function waitForRun(runId: string): Promise<{
  status: string;
  datasetId: string;
  cost: number;
}> {
  let pollCount = 0;
  while (true) {
    await sleep(15000);
    pollCount++;

    const res = await fetch(
      `${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );
    const data = await res.json();
    const status = data.data.status;

    if (pollCount % 4 === 0) {
      const mins = Math.round((pollCount * 15) / 60);
      console.log(`  ... ${mins} min (status: ${status})...`);
    }

    if (
      status === "SUCCEEDED" ||
      status === "FAILED" ||
      status === "ABORTED" ||
      status === "TIMED-OUT"
    ) {
      return {
        status,
        datasetId: data.data.defaultDatasetId,
        cost: data.data.usageTotalUsd || 0,
      };
    }
  }
}

async function fetchDataset(datasetId: string): Promise<unknown[]> {
  const results: unknown[] = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${APIFY_BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&offset=${offset}&limit=1000&format=json`
    );
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) break;
    results.push(...items);
    offset += items.length;
    if (items.length < 1000) break;
  }
  return results;
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 0;
  const dryRun = args.includes("--dry-run");
  const updateDb = args.includes("--update-db");

  console.log("=== Google Maps Email Extractor via Apify ===");
  console.log(`Actor: ${APIFY_ACTOR}`);
  if (dryRun) console.log("[DRY RUN]");
  if (updateDb) console.log("[UPDATE DB]");

  // 1. Charger categories
  console.log("\n1. Chargement des categories...");
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("id", { ascending: true });

  if (!categories || categories.length === 0) {
    console.error("Aucune categorie trouvee.");
    process.exit(1);
  }

  // Principales villes de la Vienne pour elargir la couverture
  const mainCities = [
    "Poitiers",
    "Châtellerault",
    "Loudun",
    "Montmorillon",
    "Civray",
  ];

  // Construire les requetes : "categorie ville, Vienne" pour chaque combo
  let searchQueries: string[] = [];
  const catNames: string[] = [];

  for (const cat of categories) {
    // Recherches larges par departement
    searchQueries.push(`${cat.name} Vienne 86`);
    // + les principales villes pour capter plus de resultats
    for (const city of mainCities) {
      searchQueries.push(`${cat.name} ${city}`);
    }
    catNames.push(cat.name);
  }

  // Deduplicate
  searchQueries = [...new Set(searchQueries)];

  if (limit > 0) {
    searchQueries = searchQueries.slice(0, limit);
  }

  console.log(`  ${categories.length} categories`);
  console.log(`  ${searchQueries.length} requetes de recherche`);
  console.log(`  Exemples:`);
  searchQueries.slice(0, 8).forEach((q) => console.log(`    - "${q}"`));
  if (searchQueries.length > 8)
    console.log(`    ... et ${searchQueries.length - 8} autres`);

  const estimatedResults = searchQueries.length * 30; // ~30 resultats par recherche en moyenne
  const estimatedCost = (estimatedResults / 1000) * 9;
  console.log(`\n  Resultats estimes: ~${estimatedResults}`);
  console.log(`  Cout estime: ~$${estimatedCost.toFixed(2)}`);

  if (dryRun) {
    console.log("\n[DRY RUN] Arret. Relancez sans --dry-run.");
    return;
  }

  // 2. Lancer le scraping
  console.log("\n2. Lancement du scraping Apify...");
  console.log(`  ${searchQueries.length} requetes en un seul run...`);

  const runId = await startApifyRun(searchQueries);
  console.log(`  Run ID: ${runId}`);

  const result = await waitForRun(runId);
  console.log(`  Status: ${result.status}`);
  console.log(`  Cout: $${result.cost.toFixed(2)}`);

  if (result.status !== "SUCCEEDED") {
    console.error(`  ECHEC! Status: ${result.status}`);
    process.exit(1);
  }

  // 3. Recuperer les resultats
  console.log("\n3. Recuperation des resultats...");
  const gmResults = await fetchDataset(result.datasetId);
  console.log(`  ${gmResults.length} resultats Google Maps`);

  // Sauvegarder le JSON brut
  fs.writeFileSync(
    path.join(process.cwd(), "apify_raw_results.json"),
    JSON.stringify(gmResults, null, 2)
  );

  // 4. Analyser les resultats
  console.log("\n4. Analyse des resultats...");
  let withEmail = 0;
  let withPhone = 0;
  let withWebsite = 0;

  for (const item of gmResults as Record<string, unknown>[]) {
    const emails = (item.emails as string[]) || [];
    const email = (item.email as string) || "";
    if (email || emails.length > 0) withEmail++;
    if (item.phone) withPhone++;
    if (item.website && item.website !== "undefined") withWebsite++;
  }

  console.log(`  Avec email: ${withEmail}`);
  console.log(`  Avec telephone: ${withPhone}`);
  console.log(`  Avec site web: ${withWebsite}`);

  // 5. Charger les pros pour le matching
  console.log("\n5. Chargement des pros pour matching...");
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
  while (true) {
    const { data } = await supabase
      .from("pros")
      .select(
        "id, name, slug, address, phone, email, website, city_id, category_id"
      )
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    allPros.push(...data);
    from += data.length;
    if (data.length < 1000) break;
  }

  const cityIds = [...new Set(allPros.map((p) => p.city_id).filter(Boolean))];
  const catIds = [
    ...new Set(allPros.map((p) => p.category_id).filter(Boolean)),
  ];
  const { data: cities } = await supabase
    .from("cities")
    .select("id, name")
    .in("id", cityIds);
  const { data: cats } = await supabase
    .from("categories")
    .select("id, name")
    .in("id", catIds);
  const cityMap = new Map(
    (cities || []).map((c: { id: number; name: string }) => [c.id, c.name])
  );
  const catMap = new Map(
    (cats || []).map((c: { id: number; name: string }) => [c.id, c.name])
  );

  console.log(`  ${allPros.length} pros charges`);

  // 6. Matching
  console.log("\n6. Matching...");
  const matchedProIds = new Set<number>();
  const rows: Record<string, unknown>[] = [];
  let matchCount = 0;
  let emailsMatched = 0;

  for (const gm of gmResults as Record<string, unknown>[]) {
    const title = (gm.title as string) || "";
    if (!title) continue;

    let bestPro: (typeof allPros)[0] | null = null;
    let bestSim = 0;

    for (const pro of allPros) {
      if (matchedProIds.has(pro.id)) continue;
      const sim = similarity(pro.name, title);
      if (sim > bestSim && sim >= 0.5) {
        bestSim = sim;
        bestPro = pro;
      }
    }

    const gmEmails = (gm.emails as string[]) || [];
    const gmEmail =
      (gm.email as string) || (gmEmails.length > 0 ? gmEmails[0] : "");
    const gmWebsite =
      gm.website && gm.website !== "undefined" ? (gm.website as string) : "";
    const gmPhone = (gm.phone as string) || "";
    const gmScore = computeScore(
      gm.totalScore as number | null,
      gm.reviewsCount as number | null
    );

    if (bestPro) {
      matchCount++;
      matchedProIds.add(bestPro.id);
      if (gmEmail) emailsMatched++;

      rows.push({
        ID: bestPro.id,
        "Nom Workwave": bestPro.name,
        Slug: bestPro.slug,
        Ville: cityMap.get(bestPro.city_id) || "",
        Categorie: catMap.get(bestPro.category_id) || "",
        "Email actuel": bestPro.email || "",
        "Tel actuel": bestPro.phone || "",
        "Site actuel": bestPro.website || "",
        "Nom GM": title,
        "Adresse GM": (gm.address as string) || "",
        "Tel GM": gmPhone,
        "Email GM": gmEmail,
        "Tous emails GM": gmEmails.join(", "),
        "Note Google": (gm.totalScore as number) || "",
        "Nb Avis": (gm.reviewsCount as number) || 0,
        "Site GM": gmWebsite,
        "Lat": (gm.location as { lat: number })?.lat || "",
        "Lng": (gm.location as { lng: number })?.lng || "",
        "URL GM": (gm.url as string) || "",
        Score: gmScore !== null ? parseFloat(gmScore.toFixed(1)) : "",
        Match: "OUI",
        Similarite: parseFloat(bestSim.toFixed(2)),
      });
    } else {
      rows.push({
        ID: "",
        "Nom Workwave": "",
        Slug: "",
        Ville: "",
        Categorie: "",
        "Email actuel": "",
        "Tel actuel": "",
        "Site actuel": "",
        "Nom GM": title,
        "Adresse GM": (gm.address as string) || "",
        "Tel GM": gmPhone,
        "Email GM": gmEmail,
        "Tous emails GM": gmEmails.join(", "),
        "Note Google": (gm.totalScore as number) || "",
        "Nb Avis": (gm.reviewsCount as number) || 0,
        "Site GM": gmWebsite,
        "Lat": (gm.location as { lat: number })?.lat || "",
        "Lng": (gm.location as { lng: number })?.lng || "",
        "URL GM": (gm.url as string) || "",
        Score: gmScore !== null ? parseFloat(gmScore.toFixed(1)) : "",
        Match: "NON",
        Similarite: 0,
      });
    }
  }

  rows.sort(
    (a, b) => ((b.Score as number) || 0) - ((a.Score as number) || 0)
  );

  console.log(`  Matches: ${matchCount}`);
  console.log(`  Emails matches: ${emailsMatched}`);

  // 7. Mise a jour base
  if (updateDb) {
    console.log("\n7. Mise a jour base...");
    let dbUpdated = 0;
    for (const row of rows) {
      if (row.Match !== "OUI" || !row.ID) continue;
      const proId = row.ID as number;
      const pro = allPros.find((p) => p.id === proId);
      if (!pro) continue;

      const updates: Record<string, unknown> = {};
      if (row["Email GM"] && !pro.email) updates.email = row["Email GM"];
      if (row["Tel GM"] && !pro.phone) updates.phone = row["Tel GM"];
      if (row["Site GM"] && !pro.website) updates.website = row["Site GM"];

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("pros")
          .update(updates)
          .eq("id", proId);
        if (!error) dbUpdated++;
      }
    }
    console.log(`  ${dbUpdated} pros mis a jour`);
  }

  // 8. Excel
  console.log("\n8. Generation Excel...");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 8 },
    { wch: 35 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 15 },
    { wch: 30 },
    { wch: 35 },
    { wch: 40 },
    { wch: 15 },
    { wch: 30 },
    { wch: 40 },
    { wch: 6 },
    { wch: 8 },
    { wch: 35 },
    { wch: 10 },
    { wch: 10 },
    { wch: 50 },
    { wch: 8 },
    { wch: 5 },
    { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Pros Google Maps");

  const xlsxPath = path.join(process.cwd(), "pros_google_maps.xlsx");
  XLSX.writeFile(wb, xlsxPath);
  console.log(`  ${xlsxPath}`);

  // 9. Cout
  const costsPath = path.join(process.cwd(), "couts_apify.md");
  const costsContent = `# Couts Apify - Google Maps Email Extractor

Date: ${new Date().toLocaleDateString("fr-FR")}

## Run
- Actor: ${APIFY_ACTOR}
- Run ID: ${runId}
- Requetes: ${searchQueries.length}
- Resultats: ${gmResults.length}
- Cout: $${result.cost.toFixed(2)}

## Resultats
- Pros matches: ${matchCount}
- Emails trouves: ${withEmail}
- Emails matches (avec pro): ${emailsMatched}
- Telephones: ${withPhone}
- Sites web: ${withWebsite}

## Fichiers
1. pros_google_maps.xlsx : ${rows.length} lignes
2. apify_raw_results.json : resultats bruts
3. couts_apify.md : ce fichier

## Score
score = (note_google × 20) + (log10(nb_avis + 1) × 10)
`;

  fs.writeFileSync(costsPath, costsContent);
  console.log(`  ${costsPath}`);

  // Resume
  console.log("\n=== RESUME ===");
  console.log(`Requetes: ${searchQueries.length}`);
  console.log(`Resultats GM: ${gmResults.length}`);
  console.log(`Matches: ${matchCount}`);
  console.log(`Emails trouves: ${withEmail}`);
  console.log(`Emails matches: ${emailsMatched}`);
  console.log(`Cout: $${result.cost.toFixed(2)}`);
  console.log(`\nFichiers: pros_google_maps.xlsx + couts_apify.md + apify_raw_results.json`);
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
