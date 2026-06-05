/**
 * Import des 16 arrondissements de Marseille + rattachement des artisans.
 *
 * CONTEXTE : le scrape SIRENE du dept 13 a importé ~17 555 artisans marseillais
 * mais avec city_id = NULL (leur code INSEE = arrondissement 132xx, absent de la
 * table `cities` qui ne contenait que la commune générique "Marseille" 13055).
 *
 * CE SCRIPT (idempotent) :
 *   1. crée les 16 villes "Marseille Xe Arrondissement" (données RÉELLES sourcées
 *      depuis geo.api.gouv.fr : nom, code INSEE, code postal, population, GPS).
 *   2. rattache les artisans par code postal (13001->1er ... 13016->16e),
 *      uniquement WHERE city_id IS NULL ET claimed_by_user_id IS NULL (sécurité).
 *
 * PAS de re-scrape : les pros sont déjà en base, on corrige juste le city_id.
 *
 * Usage : npx tsx scripts/import-marseille-arrondissements.ts [--dry-run]
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry-run");
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// slug façon scraping/load_cities_regions.py make_slug()
function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Arr = {
  nom: string;
  code: string; // INSEE 132xx
  codesPostaux: string[];
  population: number;
  centre?: { coordinates: [number, number] };
};

async function fetchArrondissements(): Promise<Arr[]> {
  const url =
    "https://geo.api.gouv.fr/communes?type=arrondissement-municipal&codeDepartement=13&fields=nom,code,codesPostaux,population,centre&format=json";
  const r = await fetch(url);
  if (!r.ok) throw new Error(`geo.api.gouv.fr HTTP ${r.status}`);
  const data = (await r.json()) as Arr[];
  return data.sort((a, b) => a.code.localeCompare(b.code));
}

async function main() {
  console.log(`\n=== Import arrondissements Marseille ${DRY ? "(DRY-RUN)" : "(RÉEL)"} ===\n`);

  // 1. dept 13
  const { data: dept } = await sb
    .from("departments")
    .select("id,name")
    .eq("code", "13")
    .single();
  if (!dept) throw new Error("Dept 13 (Bouches-du-Rhône) introuvable en base");
  console.log(`Dept : ${dept.name} (id=${dept.id})`);

  // 2. données réelles geo.api.gouv.fr
  const arrs = await fetchArrondissements();
  console.log(`geo.api.gouv.fr : ${arrs.length} arrondissements sourcés\n`);
  if (arrs.length !== 16) throw new Error(`Attendu 16 arrondissements, reçu ${arrs.length}`);

  // 3. villes déjà existantes (idempotence par insee_code)
  const inseeCodes = arrs.map((a) => a.code);
  const { data: existing } = await sb
    .from("cities")
    .select("id,insee_code,slug")
    .in("insee_code", inseeCodes);
  const existingByInsee = new Map((existing || []).map((c) => [c.insee_code, c]));

  // 4. créer les villes manquantes
  const cityIdByPostal = new Map<string, number>();
  for (const a of arrs) {
    const postal = a.codesPostaux[0];
    const slug = makeSlug(a.nom); // ex. "marseille-9e-arrondissement"
    const ex = existingByInsee.get(a.code);
    if (ex) {
      cityIdByPostal.set(postal, ex.id);
      console.log(`  = ${a.code} ${a.nom} → existe déjà (city_id=${ex.id}, slug=${ex.slug})`);
      continue;
    }
    const row = {
      department_id: dept.id,
      name: a.nom,
      slug,
      postal_code: postal,
      insee_code: a.code,
      population: a.population,
      latitude: a.centre?.coordinates[1] ?? null,
      longitude: a.centre?.coordinates[0] ?? null,
    };
    if (DRY) {
      console.log(`  + [DRY] créerait ${a.code} "${a.nom}" slug=${slug} pop=${a.population} CP=${postal}`);
      cityIdByPostal.set(postal, -1); // placeholder
    } else {
      const { data: ins, error } = await sb.from("cities").insert(row).select("id").single();
      if (error) throw new Error(`Insert ${a.nom} : ${error.message}`);
      cityIdByPostal.set(postal, ins.id);
      console.log(`  + ${a.code} "${a.nom}" créé (city_id=${ins.id}, slug=${slug}, pop=${a.population})`);
    }
  }

  // 5. garde-fou : aucun pro réclamé dans le lot
  let claimedTotal = 0;
  for (const a of arrs) {
    const cp = a.codesPostaux[0];
    const { count } = await sb
      .from("pros")
      .select("id", { count: "exact", head: true })
      .eq("postal_code", cp)
      .is("city_id", null)
      .not("claimed_by_user_id", "is", null);
    claimedTotal += count || 0;
  }
  console.log(`\nGarde-fou pros réclamés (claimed) sans ville dans le lot : ${claimedTotal}`);
  if (claimedTotal > 0) {
    console.log("  ⚠️ Des pros réclamés seraient concernés — ils seront EXCLUS du rattachement (claimed_by_user_id IS NULL).");
  }

  // 6. rattachement par code postal
  console.log(`\n=== Rattachement des artisans (city_id NULL → arrondissement) ===`);
  let grand = 0;
  for (const a of arrs) {
    const cp = a.codesPostaux[0];
    const cityId = cityIdByPostal.get(cp)!;
    const { count: toMove } = await sb
      .from("pros")
      .select("id", { count: "exact", head: true })
      .eq("postal_code", cp)
      .is("city_id", null)
      .is("claimed_by_user_id", null);
    grand += toMove || 0;
    if (DRY) {
      console.log(`  [DRY] ${cp} (${a.nom}) → rattacherait ${toMove} pros`);
    } else {
      const { error } = await sb
        .from("pros")
        .update({ city_id: cityId })
        .eq("postal_code", cp)
        .is("city_id", null)
        .is("claimed_by_user_id", null);
      if (error) throw new Error(`Update ${cp} : ${error.message}`);
      console.log(`  ${cp} (${a.nom}) → ${toMove} pros rattachés à city_id=${cityId}`);
    }
  }
  console.log(`\n${DRY ? "[DRY] " : ""}TOTAL : ${grand} artisans ${DRY ? "seraient " : ""}rattachés à Marseille par arrondissement.`);
  if (DRY) console.log("\n→ Relance SANS --dry-run pour appliquer.");
}

main().catch((e) => {
  console.error("ERREUR :", e.message);
  process.exit(1);
});
