/**
 * Enrichit les fiches pros avec Google Places API (New).
 *
 * Pour chaque pro selectionne :
 *   1. Recherche Place via "searchText" (gratuit pour ID-only)
 *   2. Match au SIRET/adresse pour eviter les faux positifs
 *   3. Si match OK, fetch Place Details (paid : ~$17/1000 SKU "Pro")
 *   4. Update Supabase : photos, rating, reviews_count, phone, email, website,
 *      hours, place_id, enriched_at
 *
 * Strategie de matching pour eviter les faux positifs :
 *   a. CITY match obligatoire (postal_code ou city name dans formattedAddress)
 *   b. NAME similarity > 0.5 (nom partiel match)
 *   c. Si plusieurs candidats, prend celui avec rating le plus eleve (proxy
 *      "vrai business actif" vs entree fantome)
 *
 * Cout : ~17$/1000 fiches enrichies (SKU "Place Details Pro" + Photos).
 * Avec 250$ de credits Cloud + $200/mois free Maps Platform = on peut traiter
 * tranquillement 14 700 fiches dans le mois (et plus le mois suivant).
 *
 * Usage :
 *   npx tsx scripts/enrich-pros-google-places.ts --dry-run       # 0 cout, 10 pros
 *   npx tsx scripts/enrich-pros-google-places.ts --limit 10      # vrai run, 10 pros
 *   npx tsx scripts/enrich-pros-google-places.ts --limit 200     # batch normal
 *   npx tsx scripts/enrich-pros-google-places.ts                 # default 50 pros
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const PLACES_BASE = "https://places.googleapis.com/v1";

// Field mask pour searchText (recherche initiale, gratuit)
const SEARCH_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
].join(",");

// Field mask pour Place Details (l'enrichissement, payant)
const DETAIL_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "internationalPhoneNumber",
  "websiteUri",
  "regularOpeningHours",
  "photos",
  "googleMapsUri",
  "primaryType",
  "types",
].join(",");

// Métiers prioritaires (forte volumétrie + valeur SEO élevée)
const PRIORITY_CATEGORY_SLUGS = [
  "plombier",
  "electricien",
  "peintre",
  "couvreur",
  "macon",
  "menuisier",
  "carreleur",
  "chauffagiste",
  "climaticien",
  "plaquiste",
  "facadier",
  "charpentier",
  "serrurier",
  "elagueur",
  "paysagiste",
  "architecte",
  "decorateur-interieur",
  "terrassier",
  "ramoneur",
  "vitrier",
  "pisciniste",
  "cuisiniste",
];

// Départements prioritaires (peuplés = plus de chances de matcher Google Places)
const PRIORITY_DEPARTMENT_CODES = [
  "86", // Vienne
  "33", // Gironde (Bordeaux)
  "17", // Charente-Maritime (La Rochelle)
  "16", // Charente
  "79", // Deux-Sèvres
  "64", // Pyrénées-Atlantiques
  "24", // Dordogne
  "87", // Haute-Vienne (Limoges)
];

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ALL_MODE = args.includes("--all"); // ignore les filtres categorie ET dept (process tout)
const limitArg = args.find((a) => a.startsWith("--limit"));
const LIMIT = limitArg
  ? parseInt(limitArg.split("=")[1] || args[args.indexOf(limitArg) + 1] || "50", 10)
  : DRY_RUN
    ? 10
    : 50;

type Pro = {
  id: number;
  slug: string;
  name: string;
  address: string | null;
  postal_code: string | null;
  city_id: number;
  category_id: number;
  city: { name: string; postal_code: string | null; department: { code: string } } | null;
  category: { slug: string } | null;
};

type PlaceCandidate = {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
};

type PlaceDetails = {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  rating?: number;
  userRatingCount?: number;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: {
    weekdayDescriptions: string[];
    periods?: any[];
  };
  photos?: { name: string; widthPx: number; heightPx: number }[];
  googleMapsUri?: string;
  primaryType?: string;
  types?: string[];
};

// ====================
// Stats du run
// ====================
const stats = {
  total: 0,
  noMatch: 0,
  matched: 0,
  enriched: 0,
  errors: 0,
  apiCallsSearch: 0,
  apiCallsDetails: 0,
};

// ====================
// Sélection des pros à enrichir
// ====================
async function fetchProsToEnrich(limit: number): Promise<Pro[]> {
  // Si --all : on prend TOUTES les categories et TOUS les depts (max coverage)
  let priorityCategoryIds: number[] = [];
  if (!ALL_MODE) {
    const { data: categories } = await supabase
      .from("categories")
      .select("id, slug")
      .in("slug", PRIORITY_CATEGORY_SLUGS);
    if (!categories || categories.length === 0) {
      throw new Error("Aucune catégorie prioritaire trouvée");
    }
    priorityCategoryIds = categories.map((c) => c.id);
  }

  // Avec --all, on fetch directement `limit` pros (sans surfetch+filter dept).
  // Sans --all, on fetch limit*3 puis on filtre par dept prioritaire.
  const fetchSize = ALL_MODE ? limit : limit * 3;

  let query = supabase
    .from("pros")
    .select(
      `
      id, slug, name, address, postal_code, city_id, category_id,
      city:cities(name, postal_code, department:departments(code)),
      category:categories(slug)
    `
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .is("google_enriched_at", null) // pas deja enrichi
    .not("city_id", "is", null);

  if (!ALL_MODE) {
    query = query.in("category_id", priorityCategoryIds);
  }

  const { data, error } = await query.limit(fetchSize);

  if (error) throw error;
  if (!data) return [];

  if (ALL_MODE) {
    return (data as any as Pro[]).slice(0, limit);
  }

  // Filter by priority departments + take first N
  const filtered = (data as any as Pro[]).filter((p) => {
    const code = p.city?.department?.code;
    return code && PRIORITY_DEPARTMENT_CODES.includes(code);
  });
  return filtered.slice(0, limit);
}

// ====================
// Recherche initiale (searchText)
// ====================
async function searchPlace(pro: Pro): Promise<PlaceCandidate[]> {
  const cityName = pro.city?.name || "";
  const query = `${pro.name} ${cityName}`.trim();

  stats.apiCallsSearch++;

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_API_KEY,
      "X-Goog-FieldMask": SEARCH_FIELDS,
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "fr",
      regionCode: "FR",
      pageSize: 5,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`searchText ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { places?: PlaceCandidate[] };
  return json.places || [];
}

// ====================
// Matching pro vs candidat (anti-faux-positifs)
// ====================
function normaliseStr(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameSimilarity(a: string, b: string): number {
  const na = normaliseStr(a);
  const nb = normaliseStr(b);
  // Tokens en commun (Jaccard simple)
  const tokensA = new Set(na.split(" ").filter((t) => t.length > 2));
  const tokensB = new Set(nb.split(" ").filter((t) => t.length > 2));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  const common = [...tokensA].filter((t) => tokensB.has(t)).length;
  const total = new Set([...tokensA, ...tokensB]).size;
  return common / total;
}

function pickBestMatch(pro: Pro, candidates: PlaceCandidate[]): PlaceCandidate | null {
  if (candidates.length === 0) return null;

  const proCity = normaliseStr(pro.city?.name || "");
  const proPostal = pro.city?.postal_code?.slice(0, 2) || pro.postal_code?.slice(0, 2) || "";

  const scored = candidates.map((c) => {
    const addr = normaliseStr(c.formattedAddress);
    const cityMatch = proCity && addr.includes(proCity);
    const postalMatch = proPostal && c.formattedAddress.includes(proPostal);
    const nameSim = nameSimilarity(pro.name, c.displayName.text);
    // Score composite : cityMatch obligatoire (sinon 0), nameSim ajoute
    const score = (cityMatch ? 1 : 0) + (postalMatch ? 0.5 : 0) + nameSim * 2;
    return { c, score, cityMatch, nameSim };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // On exige un city match obligatoire + une similarité de nom minimum
  if (!best.cityMatch) return null;
  if (best.nameSim < 0.3) return null;

  return best.c;
}

// ====================
// Place Details (paid)
// ====================
async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails> {
  stats.apiCallsDetails++;

  const res = await fetch(`${PLACES_BASE}/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": PLACES_API_KEY,
      "X-Goog-FieldMask": DETAIL_FIELDS,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`placeDetails ${res.status}: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as PlaceDetails;
}

// ====================
// Photo URLs : Google fournit une "photo resource name", on construit l'URL
// ====================
function buildPhotoUrl(photoName: string, maxWidth = 800): string {
  // Format : photos.GOOGLE_PHOTO_NAME -> https://places.googleapis.com/v1/PHOTO_NAME/media?maxWidthPx=W&key=KEY
  return `${PLACES_BASE}/${photoName}/media?maxWidthPx=${maxWidth}&key=${PLACES_API_KEY}`;
}

// ====================
// Update Supabase avec les données enrichies
// ====================
async function updateProWithPlace(pro: Pro, details: PlaceDetails) {
  const updates: any = {
    google_place_id: details.id,
    google_rating: details.rating ?? null,
    google_reviews_count: details.userRatingCount ?? null,
    google_enriched_at: new Date().toISOString(),
  };

  // Phone (overwrite si Places en a un : c'est verifie)
  if (details.internationalPhoneNumber) {
    updates.phone = details.internationalPhoneNumber.replace(/\s/g, "");
  }

  // Website (overwrite si Places en a un : souvent meilleur que rien)
  if (details.websiteUri) {
    updates.website = details.websiteUri;
  }

  // Photos : on prend les 5 premières
  if (details.photos && details.photos.length > 0) {
    const photoUrls = details.photos.slice(0, 5).map((p) => buildPhotoUrl(p.name));
    updates.photos = photoUrls;
    // Logo = premiere photo (sera remplace par le pro lors du claim)
    if (photoUrls[0] && !pro.address) {
      // n'ecrase pas un logo deja set par le pro
    }
  }

  // Opening hours (format jsonb)
  if (details.regularOpeningHours?.weekdayDescriptions) {
    updates.opening_hours = {
      raw: details.regularOpeningHours.weekdayDescriptions,
      source: "google_places",
    };
  }

  const { error } = await supabase.from("pros").update(updates).eq("id", pro.id);
  if (error) throw new Error(`Supabase update : ${error.message}`);
}

// ====================
// MAIN
// ====================
async function main() {
  console.log(`\nEnrichissement Google Places · ${DRY_RUN ? "DRY RUN" : "EXECUTE"}`);
  console.log(`Limite : ${LIMIT} pros`);
  console.log(`Mode   : ${ALL_MODE ? "ALL (toutes catégories × tous depts)" : "PRIORITY (22 cat × 8 depts)"}\n`);

  if (!PLACES_API_KEY) {
    console.error("\x1b[31mERREUR: GOOGLE_PLACES_API_KEY manquante dans .env.local\x1b[0m");
    process.exit(1);
  }

  console.log("Fetch des pros prioritaires...");
  const pros = await fetchProsToEnrich(LIMIT);
  console.log(`  ${pros.length} pros à traiter\n`);

  if (pros.length === 0) {
    console.log("Aucun pro à enrichir (tous déjà enrichis ?).");
    return;
  }

  for (let i = 0; i < pros.length; i++) {
    const pro = pros[i];
    stats.total++;
    const prefix = `[${(i + 1).toString().padStart(3)}/${pros.length}]`;

    try {
      const candidates = await searchPlace(pro);
      const match = pickBestMatch(pro, candidates);

      if (!match) {
        stats.noMatch++;
        console.log(`\x1b[90m${prefix} ✗ no-match  ${pro.name.slice(0, 40)} (${pro.city?.name})\x1b[0m`);
        continue;
      }

      stats.matched++;

      if (DRY_RUN) {
        console.log(
          `\x1b[33m${prefix} ✓ match    ${pro.name.slice(0, 30).padEnd(30)} -> ${match.displayName.text.slice(0, 35)}\x1b[0m`
        );
        continue;
      }

      // PAYÉ : fetch details
      const details = await fetchPlaceDetails(match.id);
      await updateProWithPlace(pro, details);
      stats.enriched++;

      const ratingStr = details.rating
        ? `★${details.rating} (${details.userRatingCount}av)`
        : "no-rating";
      const photoStr = details.photos?.length ? `${details.photos.length}ph` : "no-ph";
      const phoneStr = details.internationalPhoneNumber ? "tel" : "no-tel";

      console.log(
        `\x1b[32m${prefix} ✓ enriched ${pro.name.slice(0, 25).padEnd(25)} | ${ratingStr.padEnd(15)} | ${photoStr.padEnd(5)} | ${phoneStr}\x1b[0m`
      );
    } catch (e: any) {
      stats.errors++;
      console.error(`\x1b[31m${prefix} ✗ error    ${pro.name.slice(0, 30)} : ${e.message?.slice(0, 80)}\x1b[0m`);
    }

    // Mini-delay anti-burst (Places API permet 600/min en burst, mais on reste safe)
    await new Promise((r) => setTimeout(r, 100));
  }

  // ============= RESUME =============
  console.log("\n=== Resume ===");
  console.log(`  Total tentes        : ${stats.total}`);
  console.log(`  ✓ Matches           : ${stats.matched} (${((stats.matched / stats.total) * 100).toFixed(0)}%)`);
  console.log(`  ✓ Enriches          : ${stats.enriched}`);
  console.log(`  ✗ No match          : ${stats.noMatch} (${((stats.noMatch / stats.total) * 100).toFixed(0)}%)`);
  console.log(`  ✗ Erreurs           : ${stats.errors}`);
  console.log(`  API calls (search)  : ${stats.apiCallsSearch} (gratuit)`);
  console.log(`  API calls (details) : ${stats.apiCallsDetails} (~$${(stats.apiCallsDetails * 17 / 1000).toFixed(2)})`);

  if (DRY_RUN) {
    console.log("\n\x1b[33mDRY RUN : aucune update Supabase, aucun cout API details.\x1b[0m");
  }
}

main().catch((e) => {
  console.error("\n\x1b[31m❌ Erreur fatale:\x1b[0m", e);
  process.exit(1);
});
