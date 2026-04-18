/**
 * Audit lecture seule des catégories non-BTP avant le mini-sprint scraping.
 *
 * Affiche :
 *  - Liste des catégories par vertical (btp, domicile, personne) avec leur NAF
 *  - Compte de pros par catégorie
 *  - Conflits NAF (NAF utilisé par 2+ catégories)
 *  - Présence de seo_pages pour les catégories à drop
 *
 * Usage : npx tsx scripts/audit-non-btp-categories.ts
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TO_DROP = ["jardinage", "promenade-animaux", "lavage-voiture-a-domicile"];

async function main() {
  // 1. Charger toutes les catégories
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, slug, name, vertical, naf_codes")
    .order("vertical")
    .order("slug");

  if (catErr || !categories) {
    console.error("Erreur chargement catégories:", catErr);
    process.exit(1);
  }

  // 2. Compter les pros par catégorie
  const counts = new Map<number, number>();
  for (const cat of categories) {
    const { count } = await supabase
      .from("pros")
      .select("id", { count: "exact", head: true })
      .eq("category_id", cat.id as number)
      .eq("is_active", true)
      .is("deleted_at", null);
    counts.set(cat.id as number, count || 0);
  }

  // 3. Détecter les conflits NAF
  const nafToCategories = new Map<string, string[]>();
  for (const cat of categories) {
    const nafs = (cat.naf_codes as string[]) || [];
    for (const naf of nafs) {
      if (!nafToCategories.has(naf)) nafToCategories.set(naf, []);
      nafToCategories.get(naf)!.push(`${cat.slug} (${cat.vertical})`);
    }
  }

  // 4. Vérifier seo_pages pour les catégories à drop
  const dropCats = categories.filter((c) => TO_DROP.includes(c.slug as string));
  const seoPagesPerDrop = new Map<string, number>();
  for (const cat of dropCats) {
    const { count } = await supabase
      .from("seo_pages")
      .select("id", { count: "exact", head: true })
      .eq("category_id", cat.id as number);
    seoPagesPerDrop.set(cat.slug as string, count || 0);
  }

  // ============================================
  // AFFICHAGE
  // ============================================

  console.log("\n=== CATÉGORIES PAR VERTICAL ===\n");
  const verticals = ["btp", "domicile", "personne"];
  for (const vertical of verticals) {
    const cats = categories.filter((c) => c.vertical === vertical);
    console.log(`\n[${vertical.toUpperCase()}] ${cats.length} catégories`);
    console.log("-".repeat(70));
    for (const cat of cats) {
      const count = counts.get(cat.id as number) || 0;
      const naf = (cat.naf_codes as string[]).join(",");
      const flag = TO_DROP.includes(cat.slug as string) ? " ⚠ DROP" : "";
      console.log(`  ${(cat.slug as string).padEnd(32)} ${count.toString().padStart(6)} pros  NAF=${naf.padEnd(15)}${flag}`);
    }
  }

  console.log("\n\n=== CONFLITS NAF (NAF utilisé par 2+ catégories) ===\n");
  let hasConflicts = false;
  for (const [naf, cats] of nafToCategories) {
    if (cats.length > 1) {
      hasConflicts = true;
      console.log(`  ${naf} : ${cats.join(", ")}`);
    }
  }
  if (!hasConflicts) console.log("  (aucun conflit)");

  console.log("\n\n=== CATÉGORIES À DROP ===\n");
  for (const cat of dropCats) {
    const proCount = counts.get(cat.id as number) || 0;
    const seoCount = seoPagesPerDrop.get(cat.slug as string) || 0;
    console.log(`  ${(cat.slug as string).padEnd(32)} : ${proCount} pros, ${seoCount} seo_pages`);
  }

  // 5. Récap : ce qui sera scrapé
  console.log("\n\n=== À SCRAPER (non-BTP, non droppées) ===\n");
  const toScrap = categories.filter(
    (c) => c.vertical !== "btp" && !TO_DROP.includes(c.slug as string)
  );
  console.log(`Total : ${toScrap.length} catégories`);
  for (const cat of toScrap) {
    const count = counts.get(cat.id as number) || 0;
    const naf = (cat.naf_codes as string[]).join(",");
    console.log(`  ${(cat.slug as string).padEnd(32)} ${count.toString().padStart(6)} pros  NAF=${naf}`);
  }
}

main().catch((err) => {
  console.error("Erreur:", err);
  process.exit(1);
});
