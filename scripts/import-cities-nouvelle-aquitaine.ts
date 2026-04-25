/**
 * Import des departements et communes de la Nouvelle-Aquitaine (sauf Vienne 86 deja en base).
 *
 * Source : codes_postaux_nouvelle_aquitaine.xlsx (Etalab + INSEE).
 * Enrichissement lat/lng/population : API Etalab geo.api.gouv.fr (gratuit, sans cle).
 *
 * Usage :
 *   npx tsx scripts/import-cities-nouvelle-aquitaine.ts --dry-run
 *   npx tsx scripts/import-cities-nouvelle-aquitaine.ts                  # import structurel uniquement
 *   npx tsx scripts/import-cities-nouvelle-aquitaine.ts --enrich-geo     # import + lat/lng/population
 *   npx tsx scripts/import-cities-nouvelle-aquitaine.ts --enrich-geo --departement 33   # un seul dpt
 *   npx tsx scripts/import-cities-nouvelle-aquitaine.ts --only-enrich    # enrichir les villes deja en base sans lat/lng
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// ============================================
// Config
// ============================================
const XLSX_PATH = path.resolve(
  process.cwd(),
  "codes_postaux_nouvelle_aquitaine.xlsx"
);
const SHEET_NAME = "Tous (région)";
const REGION_NAME = "Nouvelle-Aquitaine";
const SKIP_DEPT_CODE = "86"; // deja en base
const ETALAB_BATCH_SIZE = 50;
const ETALAB_PARALLEL = 5;
const SUPABASE_BATCH_SIZE = 500;

// Liste des 12 departements de Nouvelle-Aquitaine (source : INSEE)
const NA_DEPARTMENTS: { code: string; name: string }[] = [
  { code: "16", name: "Charente" },
  { code: "17", name: "Charente-Maritime" },
  { code: "19", name: "Corrèze" },
  { code: "23", name: "Creuse" },
  { code: "24", name: "Dordogne" },
  { code: "33", name: "Gironde" },
  { code: "40", name: "Landes" },
  { code: "47", name: "Lot-et-Garonne" },
  { code: "64", name: "Pyrénées-Atlantiques" },
  { code: "79", name: "Deux-Sèvres" },
  { code: "86", name: "Vienne" },
  { code: "87", name: "Haute-Vienne" },
];

// ============================================
// Args CLI
// ============================================
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ENRICH_GEO = args.includes("--enrich-geo");
const ONLY_ENRICH = args.includes("--only-enrich");
const deptArgIdx = args.indexOf("--departement");
const FILTER_DEPT =
  deptArgIdx >= 0 && args[deptArgIdx + 1] ? args[deptArgIdx + 1] : null;

// ============================================
// Types
// ============================================
type XlsxRow = {
  "Code postal": string | number;
  Commune: string;
  "Code INSEE": string | number;
  Département: string | number;
  "Nom du département": string;
  "Libellé acheminement": string;
};

type CityToInsert = {
  department_id: number;
  name: string;
  slug: string;
  postal_code: string;
  insee_code: string;
};

// ============================================
// Supabase client
// ============================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// Helpers
// ============================================
function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pad5(s: string | number): string {
  return String(s).padStart(5, "0");
}

function pad2(s: string | number): string {
  return String(s).padStart(2, "0");
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// Etape 1 : Importer les departements manquants
// ============================================
async function importDepartments(): Promise<Map<string, number>> {
  console.log("\n=== Etape 1 : Departements ===");

  const { data: existing } = await supabase
    .from("departments")
    .select("id, code");
  const existingMap = new Map(
    (existing || []).map((d) => [d.code, d.id as number])
  );
  console.log(`Existant en base : ${existingMap.size} departement(s)`);

  const toInsert = NA_DEPARTMENTS.filter(
    (d) => !existingMap.has(d.code) && d.code !== SKIP_DEPT_CODE
  ).map((d) => ({
    code: d.code,
    name: d.name,
    region: REGION_NAME,
  }));

  console.log(`A inserer : ${toInsert.length} departement(s)`);
  if (toInsert.length > 0) {
    console.log("  ->", toInsert.map((d) => `${d.code} (${d.name})`).join(", "));
  }

  if (DRY_RUN) {
    console.log("[DRY RUN] Skip insert.");
    // Simuler le mapping pour le dry run
    NA_DEPARTMENTS.forEach((d) => {
      if (!existingMap.has(d.code)) existingMap.set(d.code, -1);
    });
    return existingMap;
  }

  if (toInsert.length > 0) {
    const { data, error } = await supabase
      .from("departments")
      .insert(toInsert)
      .select("id, code");
    if (error) throw new Error(`Insert departments: ${error.message}`);
    for (const d of data || []) existingMap.set(d.code, d.id as number);
    console.log(`Inseres : ${data?.length || 0}`);
  }

  return existingMap;
}

// ============================================
// Etape 2 : Lire et dedupliquer le xlsx
// ============================================
function readAndDedupCities(): Map<string, CityToInsert[]> {
  console.log("\n=== Etape 2 : Lecture xlsx + dedup ===");

  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets[SHEET_NAME];
  if (!ws) throw new Error(`Onglet "${SHEET_NAME}" introuvable`);

  const rows = XLSX.utils.sheet_to_json<XlsxRow>(ws);
  console.log(`Lignes lues du xlsx : ${rows.length}`);

  // Dedup par insee_code (une commune peut avoir plusieurs codes postaux)
  // On garde la premiere occurence (souvent le code postal "principal")
  const byInsee = new Map<
    string,
    { name: string; postal_code: string; dept_code: string }
  >();
  for (const row of rows) {
    const inseeCode = pad5(row["Code INSEE"]);
    const deptCode = pad2(row.Département);
    if (deptCode === SKIP_DEPT_CODE) continue; // ignorer la Vienne
    if (FILTER_DEPT && deptCode !== FILTER_DEPT) continue;
    if (!byInsee.has(inseeCode)) {
      byInsee.set(inseeCode, {
        name: String(row.Commune).trim(),
        postal_code: pad5(row["Code postal"]),
        dept_code: deptCode,
      });
    }
  }

  console.log(`Communes uniques (apres dedup insee) : ${byInsee.size}`);

  // Grouper par departement pour les stats et l'insert batch
  const byDept = new Map<string, CityToInsert[]>();
  for (const [insee, info] of byInsee) {
    const slug = makeSlug(info.name);
    if (!byDept.has(info.dept_code)) byDept.set(info.dept_code, []);
    byDept.get(info.dept_code)!.push({
      department_id: -1, // a remplir avec le mapping
      name: info.name,
      slug,
      postal_code: info.postal_code,
      insee_code: insee,
    });
  }

  console.log("\nRepartition par departement :");
  for (const dept of NA_DEPARTMENTS) {
    if (dept.code === SKIP_DEPT_CODE) continue;
    const count = byDept.get(dept.code)?.length || 0;
    console.log(`  ${dept.code} ${dept.name.padEnd(22)} : ${count}`);
  }

  return byDept;
}

// ============================================
// Etape 3 : Inserer les communes en base
// ============================================
async function insertCities(
  byDept: Map<string, CityToInsert[]>,
  deptIdMap: Map<string, number>
): Promise<void> {
  console.log("\n=== Etape 3 : Insert cities ===");

  // Charger les communes deja en base pour skip celles deja presentes (par insee_code)
  let existingInseeCodes = new Set<string>();
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("cities")
      .select("insee_code")
      .not("insee_code", "is", null)
      .range(offset, offset + 999);
    if (error) throw new Error(`Read existing cities: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const r of data) existingInseeCodes.add(r.insee_code as string);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`Communes deja en base : ${existingInseeCodes.size}`);

  let totalToInsert = 0;
  let totalInserted = 0;

  for (const [deptCode, cities] of byDept) {
    const deptId = deptIdMap.get(deptCode);
    if (!deptId || deptId === -1) {
      if (DRY_RUN) {
        console.log(`  [DRY RUN] dept ${deptCode} : ${cities.length} communes (id non resolu en dry-run)`);
        totalToInsert += cities.length;
        continue;
      }
      throw new Error(`Department ${deptCode} non trouve en base`);
    }

    const toInsert = cities
      .filter((c) => !existingInseeCodes.has(c.insee_code))
      .map((c) => ({ ...c, department_id: deptId }));

    totalToInsert += toInsert.length;

    if (DRY_RUN) {
      console.log(
        `  dept ${deptCode} : ${toInsert.length} a inserer (sur ${cities.length} totales)`
      );
      continue;
    }

    if (toInsert.length === 0) {
      console.log(`  dept ${deptCode} : tout deja en base, skip`);
      continue;
    }

    // Insert par batch
    let batchInserted = 0;
    for (let i = 0; i < toInsert.length; i += SUPABASE_BATCH_SIZE) {
      const batch = toInsert.slice(i, i + SUPABASE_BATCH_SIZE);
      const { error } = await supabase.from("cities").insert(batch);
      if (error) {
        // Fallback : insert ligne par ligne pour identifier les problemes
        console.log(`    Batch failed: ${error.message}, fallback unitaire...`);
        for (const row of batch) {
          const { error: e2 } = await supabase.from("cities").insert(row);
          if (!e2) batchInserted++;
          else console.log(`      Skip ${row.insee_code} (${row.name}): ${e2.message}`);
        }
      } else {
        batchInserted += batch.length;
      }
    }

    totalInserted += batchInserted;
    console.log(`  dept ${deptCode} : ${batchInserted} inserees`);
  }

  console.log(`\nTotal a inserer : ${totalToInsert}`);
  if (!DRY_RUN) console.log(`Total inserees : ${totalInserted}`);
}

// ============================================
// Etape 4 : Enrichir lat/lng/population via Etalab
// ============================================
async function enrichGeoData(): Promise<void> {
  console.log("\n=== Etape 4 : Enrichissement geo via Etalab ===");

  // Recuperer toutes les villes sans lat (ou par dept si filtre)
  let q = supabase
    .from("cities")
    .select("id, name, insee_code, department_id, departments!inner(code)")
    .is("latitude", null)
    .not("insee_code", "is", null);

  if (FILTER_DEPT) {
    q = q.eq("departments.code", FILTER_DEPT);
  }

  const { data: citiesRaw, error } = await q;
  if (error) throw new Error(`Read cities sans lat: ${error.message}`);

  const cities = (citiesRaw || []) as Array<{
    id: number;
    name: string;
    insee_code: string;
    department_id: number;
  }>;

  console.log(`Villes a enrichir : ${cities.length}`);
  if (cities.length === 0) {
    console.log("Rien a faire.");
    return;
  }

  if (DRY_RUN) {
    console.log("[DRY RUN] Skip enrichissement.");
    return;
  }

  let enriched = 0;
  let failed = 0;

  // Etalab : on utilise l'endpoint /communes avec ?codeInsee=xxx,yyy,zzz
  // Mais le plus simple : appel unitaire en parallele controle (limite 50 paralleles)
  for (let i = 0; i < cities.length; i += ETALAB_BATCH_SIZE) {
    const batch = cities.slice(i, i + ETALAB_BATCH_SIZE);

    // Parallelise les requetes Etalab par groupes de ETALAB_PARALLEL
    const updates: Array<{
      id: number;
      latitude: number | null;
      longitude: number | null;
      population: number | null;
    }> = [];

    for (let j = 0; j < batch.length; j += ETALAB_PARALLEL) {
      const subBatch = batch.slice(j, j + ETALAB_PARALLEL);
      const results = await Promise.all(
        subBatch.map(async (city) => {
          try {
            const url = `https://geo.api.gouv.fr/communes/${city.insee_code}?fields=nom,code,centre,population&format=json`;
            const resp = await fetch(url);
            if (!resp.ok) {
              return { city, ok: false, latitude: null, longitude: null, population: null };
            }
            const data = (await resp.json()) as {
              centre?: { coordinates?: [number, number] };
              population?: number;
            };
            const coords = data.centre?.coordinates;
            return {
              city,
              ok: !!coords,
              latitude: coords ? coords[1] : null,
              longitude: coords ? coords[0] : null,
              population: data.population || null,
            };
          } catch {
            return { city, ok: false, latitude: null, longitude: null, population: null };
          }
        })
      );

      for (const r of results) {
        if (r.ok) {
          updates.push({
            id: r.city.id,
            latitude: r.latitude,
            longitude: r.longitude,
            population: r.population,
          });
          enriched++;
        } else {
          failed++;
        }
      }

      // Petit delai pour rester gentil avec Etalab
      await sleep(50);
    }

    // Update Supabase par batch
    for (const u of updates) {
      const { error: e } = await supabase
        .from("cities")
        .update({
          latitude: u.latitude,
          longitude: u.longitude,
          population: u.population,
        })
        .eq("id", u.id);
      if (e) console.log(`  Update ${u.id} failed: ${e.message}`);
    }

    if ((i + batch.length) % 200 === 0 || i + batch.length >= cities.length) {
      console.log(
        `  Progression : ${i + batch.length}/${cities.length} traites, ${enriched} OK, ${failed} echec`
      );
    }
  }

  console.log(`\nEnrichissement termine : ${enriched} OK, ${failed} echec`);
}

// ============================================
// Main
// ============================================
async function main() {
  console.log("============================================");
  console.log("Import villes Nouvelle-Aquitaine");
  console.log("============================================");
  if (DRY_RUN) console.log("MODE : DRY-RUN (aucune ecriture)");
  if (FILTER_DEPT) console.log(`FILTRE : departement ${FILTER_DEPT} uniquement`);
  if (ENRICH_GEO) console.log("ENRICHISSEMENT GEO : active");
  if (ONLY_ENRICH) console.log("MODE : enrichissement uniquement (skip import)");

  if (ONLY_ENRICH) {
    await enrichGeoData();
    return;
  }

  const deptIdMap = await importDepartments();
  const byDept = readAndDedupCities();
  await insertCities(byDept, deptIdMap);

  if (ENRICH_GEO) {
    await enrichGeoData();
  }

  console.log("\n=== Verification finale ===");
  if (!DRY_RUN) {
    const { count: deptCount } = await supabase
      .from("departments")
      .select("id", { count: "exact", head: true });
    const { count: cityCount } = await supabase
      .from("cities")
      .select("id", { count: "exact", head: true });
    const { count: cityWithLat } = await supabase
      .from("cities")
      .select("id", { count: "exact", head: true })
      .not("latitude", "is", null);
    console.log(`  Departments : ${deptCount}`);
    console.log(`  Cities      : ${cityCount}`);
    console.log(`  Cities avec lat/lng : ${cityWithLat}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nErreur fatale :", err);
  process.exit(1);
});
