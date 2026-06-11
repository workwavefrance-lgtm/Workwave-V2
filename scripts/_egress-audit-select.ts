/**
 * Audit egress : mesure la taille JSON d'une row pros avec l'ancien
 * PRO_SELECT (fat) vs les nouveaux selects (card / fiche), et liste les
 * colonnes reelles des tables jointes (cities, categories, departments)
 * pour valider que les selects par colonnes nommees ne 400 pas.
 *
 * Usage : npx tsx scripts/_egress-audit-select.ts
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const FAT = "*, category:categories(*), city:cities(*, department:departments(*))";

const CARD =
  "id, slug, name, address, postal_code, phone, description, logo_url, claimed_by_user_id, category_id, city_id, " +
  "google_rating, google_reviews_count, google_place_id, workwave_reviews_avg, workwave_reviews_count, " +
  "founded_year, certifications, rge_certified, has_decennale, has_rc_pro, photos, profile_completion, " +
  "category:categories(id, slug, name, vertical), city:cities(id, name, slug)";

const FICHE =
  "*, category:categories(id, slug, name, vertical, parent_id), " +
  "city:cities(id, department_id, name, slug, postal_code, insee_code, population, latitude, longitude, " +
  "department:departments(id, code, name, region))";

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Colonnes reelles des tables jointes
  for (const table of ["categories", "cities", "departments"]) {
    const { data, error } = await sb.from(table).select("*").limit(1);
    if (error) {
      console.error(`ERREUR ${table}:`, error.message);
      continue;
    }
    console.log(`\n=== ${table} columns ===`);
    console.log(Object.keys(data?.[0] || {}).join(", "));
  }

  // 2. Un pro actif avec city + un peu de data (Poitiers plombier si possible)
  const { data: sample, error: e0 } = await sb
    .from("pros")
    .select("slug")
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("city_id", "is", null)
    .not("description", "is", null)
    .limit(1);
  if (e0 || !sample?.[0]) {
    console.error("Pas de pro sample:", e0?.message);
    return;
  }
  const slug = sample[0].slug;
  console.log(`\n=== Pro sample : ${slug} ===`);

  for (const [label, sel] of [
    ["FAT (avant)", FAT],
    ["CARD (apres, listings/similaires)", CARD],
    ["FICHE (apres, fiche/dashboard)", FICHE],
  ] as const) {
    const { data, error } = await sb.from("pros").select(sel).eq("slug", slug).single();
    if (error) {
      console.error(`ERREUR select ${label}:`, error.message);
      continue;
    }
    const bytes = JSON.stringify(data).length;
    console.log(`${label}: ${bytes} octets/row`);
  }

  // 3. Un slug reel pour les tests curl (pro actif Vienne plombier de preference)
  const { data: testPro } = await sb
    .from("pros")
    .select("slug, name, city:cities(name, slug)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("city_id", "is", null)
    .eq("category_id", 1)
    .limit(3);
  console.log("\n=== Slugs de test (category_id=1) ===");
  console.log(JSON.stringify(testPro, null, 2));
}

main();
