/**
 * Seed Workwave AI : freelances tech via Sirene (recherche-entreprises.api.gouv.fr).
 *
 * Strategie : utiliser l'API publique gratuite (pas de token) avec filtres :
 *   - activite_principale ∈ codes NAF informatique (62.01Z, 62.02A/B, 62.09Z, 63.11Z, 63.12Z)
 *   - est_entrepreneur_individuel=true   (micro-entrepreneurs + EI = vrais freelances)
 *   - etat_administratif=A               (entreprises actives uniquement)
 *   - per_page=25                        (max API)
 *
 * Subdivisions :
 *   - Iteration par (NAF code, departement) pour rester sous la limite de 10000
 *     resultats par query (deep pagination bloquee par l'API au-dela de page 400)
 *
 * Idempotent : ON CONFLICT(siret) DO NOTHING lors des inserts.
 *
 * Categories : tous les pros vont par defaut dans "developpement-web". La
 * re-categorisation precise (IA, Cloud, Data, etc.) viendra via GitHub
 * enrichment (scripts/enrich-github-tech.ts en Phase 4b).
 *
 * Run :
 *   npx tsx scripts/seed-sirene-tech.ts                          # dry-run France
 *   npx tsx scripts/seed-sirene-tech.ts --depts=75               # dry-run dept 75
 *   npx tsx scripts/seed-sirene-tech.ts --depts=75,92,93,94      # dry-run IDF
 *   npx tsx scripts/seed-sirene-tech.ts --depts=75 --apply       # applique sur 75
 *   npx tsx scripts/seed-sirene-tech.ts --apply                  # applique France entiere
 *
 * Volume estime France entiere (filtre micro/EI + actif) :
 *   - NAF 62.01Z (programmation)       : ~60k
 *   - NAF 62.02A (conseil syst info)   : ~15k
 *   - NAF 62.02B (TMA)                 : ~3k
 *   - NAF 62.09Z (autres info)         : ~10k
 *   - NAF 63.11Z (hebergement / data)  : ~3k
 *   - NAF 63.12Z (portails)            : ~2k
 *   Total estime : ~93k freelances tech actifs en France
 *
 * Rate limit API : ~7 req/s. Avec 100ms entre requetes = 10 req/s. Volume
 * estime ~93k / 25 per_page = 3720 requetes. Duree ~6 minutes France entiere.
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── CLI args ──────────────────────────────────────────────────────────────
const APPLY = process.argv.includes("--apply");
const DEPTS_ARG = process.argv.find((a) => a.startsWith("--depts="));
const DEPTS_FILTER: string[] | null = DEPTS_ARG
  ? DEPTS_ARG.split("=")[1].split(",").map((d) => d.trim())
  : null;

// ─── Config ────────────────────────────────────────────────────────────────
const API_BASE = "https://recherche-entreprises.api.gouv.fr/search";
const RATE_LIMIT_MS = 100; // 10 req/s, sous la limite 7-15 req/s
const PER_PAGE = 25; // max API
const MAX_PAGES_PER_SLICE = 400; // hard limit API (10000 results = 400 pages)

const NAF_CODES = [
  { code: "62.01Z", label: "Programmation informatique" },
  { code: "62.02A", label: "Conseil systemes informatiques" },
  { code: "62.02B", label: "TMA / tierce maintenance" },
  { code: "62.09Z", label: "Autres activites informatiques" },
  { code: "63.11Z", label: "Traitement de donnees / hebergement" },
  { code: "63.12Z", label: "Portails internet" },
];

// Tous les departements francais (metropole + DOM-TOM)
const ALL_DEPTS = [
  ...Array.from({ length: 19 }, (_, i) => String(i + 1).padStart(2, "0")), // 01-19
  "2A", "2B", // Corse
  ...Array.from({ length: 76 }, (_, i) => String(i + 21).padStart(2, "0")), // 21-96
  "971", "972", "973", "974", "976", // DOM
];

// ─── Types ─────────────────────────────────────────────────────────────────
type RechercheEntrepriseResult = {
  siren: string;
  siret_siege?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  date_creation?: string;
  activite_principale?: string;
  tranche_effectif_salarie?: string;
  etat_administratif?: string;
  dirigeants?: Array<{ nom?: string; prenoms?: string; type_dirigeant?: string }>;
  matching_etablissements?: Array<{
    siret: string;
    activite_principale: string;
    etat_administratif: string;
    code_postal?: string;
    libelle_commune?: string;
    adresse?: string;
    departement?: string;
    region?: string;
    latitude?: string;
    longitude?: string;
  }>;
  siege?: {
    siret?: string;
    code_postal?: string;
    libelle_commune?: string;
    adresse?: string;
    departement?: string;
    region?: string;
    latitude?: string;
    longitude?: string;
  };
};

type SeedRow = {
  siret: string;
  siren: string;
  name: string;
  category_id: number;
  city_id: number | null;
  address: string | null;
  postal_code: string | null;
  source: "sirene";
  is_active: true;
  years_experience: number | null;
  // metadata Sirene
  naf_code: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(
  naf: string,
  dept: string,
  page: number
): Promise<RechercheEntrepriseResult[]> {
  const url = new URL(API_BASE);
  url.searchParams.set("activite_principale", naf);
  url.searchParams.set("departement", dept);
  url.searchParams.set("est_entrepreneur_individuel", "true");
  url.searchParams.set("etat_administratif", "A");
  url.searchParams.set("per_page", String(PER_PAGE));
  url.searchParams.set("page", String(page));

  try {
    const r = await fetch(url.toString());
    if (!r.ok) {
      if (r.status === 429) {
        // rate limit, wait longer
        await sleep(2000);
        return fetchPage(naf, dept, page);
      }
      console.warn(`[${naf} dept=${dept} page=${page}] HTTP ${r.status}`);
      return [];
    }
    const data = (await r.json()) as { results?: RechercheEntrepriseResult[]; total_results?: number };
    return data.results || [];
  } catch (e) {
    console.warn(`[${naf} dept=${dept} page=${page}] fetch error:`, e);
    return [];
  }
}

function buildSlug(name: string, siretLast4: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return `${base}-${siretLast4}`;
}

function calculateExperienceYears(dateCreation: string | undefined): number | null {
  if (!dateCreation) return null;
  const created = new Date(dateCreation);
  if (isNaN(created.getTime())) return null;
  const years = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, Math.floor(years));
}

async function loadCategoryDefaultId(): Promise<number> {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "developpement-web")
    .eq("vertical", "tech")
    .single();
  if (error || !data) {
    console.error(
      "❌ Catégorie tech 'developpement-web' introuvable. Lancer la migration 2026-05-25_workwave_ai_tech_categories.sql d'abord."
    );
    process.exit(1);
  }
  return data.id;
}

async function loadCityIdMap(): Promise<Map<string, number>> {
  // Charge un mapping postal_code → city_id pour rapide lookup
  // Pagination Supabase (cap 1000)
  const map = new Map<string, number>();
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await supabase
      .from("cities")
      .select("id, postal_code")
      .not("postal_code", "is", null)
      .range(offset, offset + PAGE - 1);
    const rows = data || [];
    if (rows.length === 0) break;
    for (const row of rows) {
      if (row.postal_code && !map.has(row.postal_code)) {
        map.set(row.postal_code, row.id);
      }
    }
    offset += rows.length;
  }
  return map;
}

function resultToSeedRow(
  res: RechercheEntrepriseResult,
  categoryId: number,
  cityIdMap: Map<string, number>,
  nafCode: string
): SeedRow | null {
  // Recupere le siret du siege ou du 1er matching etablissement
  const etab = res.matching_etablissements?.[0] || res.siege;
  if (!etab) return null;
  const siret = (etab.siret || res.siret_siege || "").replace(/\s/g, "");
  if (!siret || siret.length !== 14) return null;

  // Nom : pour entrepreneur individuel, utiliser nom_complet (NOM Prenom) ou
  // construire via dirigeants
  let name = res.nom_complet || res.nom_raison_sociale || "";
  if (!name && res.dirigeants && res.dirigeants[0]) {
    const d = res.dirigeants[0];
    name = `${d.prenoms || ""} ${d.nom || ""}`.trim();
  }
  if (!name) return null;
  // Normaliser : "DUPONT Jean" → "Jean DUPONT" si nom_complet est en CAPS
  // Heuristique simple : si nom_complet contient un nom en CAPS suivi d'un prenom,
  // inverser. Sinon laisser tel quel.
  name = name.trim();

  const postal = (etab.code_postal || "").trim();
  const cityId = postal ? cityIdMap.get(postal) || null : null;

  return {
    siret,
    siren: res.siren,
    name,
    category_id: categoryId,
    city_id: cityId,
    address: etab.adresse?.trim() || null,
    postal_code: postal || null,
    source: "sirene",
    is_active: true,
    years_experience: calculateExperienceYears(res.date_creation),
    naf_code: nafCode,
  };
}

function sanitizeRow(r: SeedRow) {
  // Defensive truncation pour eviter les varchar overflow
  return {
    siret: r.siret.slice(0, 14),
    siren: r.siren.slice(0, 9),
    name: r.name.slice(0, 200),
    slug: buildSlug(r.name, r.siret.slice(-4)).slice(0, 200),
    category_id: r.category_id,
    city_id: r.city_id,
    address: r.address ? r.address.slice(0, 500) : null,
    postal_code: r.postal_code ? r.postal_code.slice(0, 5) : null,
    source: r.source,
    is_active: r.is_active,
    years_experience: r.years_experience,
  };
}

async function insertBatch(rows: SeedRow[]): Promise<{ inserted: number; skipped: number; errors: number }> {
  if (rows.length === 0) return { inserted: 0, skipped: 0, errors: 0 };

  const BATCH = 200;
  let totalInserted = 0;
  let totalErrors = 0;
  let totalSkipped = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const payload = slice.map(sanitizeRow);

    // .select() retourne les rows reellement inserees (pas les doublons skipped)
    const { data, error } = await supabase
      .from("pros")
      .upsert(payload, { onConflict: "siret", ignoreDuplicates: true })
      .select("id");

    if (error) {
      // Sur erreur batch, fallback single-row pour identifier la ligne fautive
      console.error(`    ⚠ Batch error (${error.code} ${error.message}), fallback single-row…`);
      for (const row of payload) {
        const { data: oneData, error: oneErr } = await supabase
          .from("pros")
          .upsert([row], { onConflict: "siret", ignoreDuplicates: true })
          .select("id");
        if (oneErr) {
          totalErrors++;
          console.warn(`      ✗ ${row.siret} (${row.name.slice(0, 30)}) → ${oneErr.code} ${oneErr.message}`);
        } else if (oneData && oneData.length > 0) {
          totalInserted++;
        } else {
          totalSkipped++;
        }
      }
      continue;
    }

    const inserted = data?.length || 0;
    totalInserted += inserted;
    totalSkipped += slice.length - inserted;
  }

  return { inserted: totalInserted, skipped: totalSkipped, errors: totalErrors };
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Workwave AI — Seed Sirene NAF informatique");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`Mode    : ${APPLY ? "✓ APPLY (insertion en base)" : "○ DRY-RUN (preview)"}`);
  console.log(`Depts   : ${DEPTS_FILTER ? DEPTS_FILTER.join(",") : "France entiere"}`);
  console.log(`NAFs    : ${NAF_CODES.map((n) => n.code).join(", ")}\n`);

  const categoryId = await loadCategoryDefaultId();
  console.log(`[init] Categorie defaut 'developpement-web' id=${categoryId}`);

  console.log(`[init] Chargement du mapping cities (postal_code → city_id)...`);
  const cityIdMap = await loadCityIdMap();
  console.log(`[init] ${cityIdMap.size} codes postaux mappes\n`);

  const depts = DEPTS_FILTER || ALL_DEPTS;
  let totalFound = 0;
  let totalInserted = 0;
  let totalRequests = 0;
  const start = Date.now();

  for (const dept of depts) {
    for (const { code: naf, label } of NAF_CODES) {
      let page = 1;
      let sliceFound = 0;
      const rowsToInsert: SeedRow[] = [];

      while (page <= MAX_PAGES_PER_SLICE) {
        const results = await fetchPage(naf, dept, page);
        totalRequests++;
        await sleep(RATE_LIMIT_MS);

        if (results.length === 0) break;
        sliceFound += results.length;

        for (const res of results) {
          const row = resultToSeedRow(res, categoryId, cityIdMap, naf);
          if (row) rowsToInsert.push(row);
        }

        if (results.length < PER_PAGE) break;
        page++;
      }

      totalFound += sliceFound;

      // Resume slice
      console.log(
        `[${dept}/${naf}] ${sliceFound} resultats API, ${rowsToInsert.length} valides`
      );

      if (APPLY && rowsToInsert.length > 0) {
        const { inserted, skipped, errors } = await insertBatch(rowsToInsert);
        totalInserted += inserted;
        console.log(
          `    → ${inserted} inseres, ${skipped} doublons SIRET${errors > 0 ? `, ${errors} erreurs` : ""}`
        );
      } else if (rowsToInsert.length > 0) {
        // Preview 1 row
        const sample = rowsToInsert[0];
        console.log(
          `    → preview: ${sample.name.slice(0, 40)} (${sample.siret}) postal=${sample.postal_code} city=${sample.city_id || "—"}`
        );
      }
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Total requetes API  : ${totalRequests}`);
  console.log(`Total resultats     : ${totalFound}`);
  console.log(`Total inseres       : ${APPLY ? totalInserted : "(dry-run)"}`);
  console.log(`Duree               : ${elapsed}s`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (!APPLY) {
    console.log(
      "Pour appliquer : npx tsx scripts/seed-sirene-tech.ts --apply"
    );
    console.log(
      "Pour scoper a un dept : --depts=75 (ou --depts=75,92,93,94)"
    );
  }
}

main().catch((e) => {
  console.error("❌ Fatal:", e);
  process.exit(1);
});
