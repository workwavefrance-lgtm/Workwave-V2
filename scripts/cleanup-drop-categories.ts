/**
 * Cleanup des 3 catégories à drop : jardinage, lavage-voiture-a-domicile, promenade-animaux.
 *
 * Ordre de suppression (respect des FK) :
 *  1. email_sequences (pro_id)
 *  2. seo_pages (category_id)
 *  3. pros (category_id)
 *  4. seo_guides (category_id)  <-- FK oubliée au 1er run, ajoutée a posteriori
 *  5. categories (id)
 *
 * Safety check préalable confirmé :
 *  - 0 pros claimed / Stripe / subscription
 *  - 0 project_leads, 0 email_logs, 0 cancellation_feedback
 *  - 0 projects.category_id, 0 categories.parent_id
 *
 * Usage :
 *   npx tsx scripts/cleanup-drop-categories.ts --dry-run    # preview seulement
 *   npx tsx scripts/cleanup-drop-categories.ts --execute    # exécution réelle
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
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isExecute = args.includes("--execute");

  if (!isDryRun && !isExecute) {
    console.error("Usage : --dry-run | --execute");
    process.exit(1);
  }

  console.log(`\nMode : ${isDryRun ? "DRY-RUN (aucune écriture)" : "EXECUTE (suppression réelle)"}\n`);

  // 1. Charger ids des catégories à drop
  const { data: cats } = await supabase
    .from("categories")
    .select("id, slug")
    .in("slug", TO_DROP);

  if (!cats || cats.length === 0) {
    console.log("Aucune des catégories à drop n'existe. Rien à faire.");
    return;
  }

  const catIds = cats.map((c) => c.id as number);
  const catSlugs = cats.map((c) => c.slug as string);
  console.log(`Catégories trouvées : ${catSlugs.join(", ")} (ids: ${catIds.join(", ")})\n`);

  // 2. Charger ids des pros associés
  let allProIds: number[] = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await supabase
      .from("pros")
      .select("id")
      .in("category_id", catIds)
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    allProIds = allProIds.concat(data.map((p) => p.id as number));
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  console.log(`Pros liés : ${allProIds.length}\n`);

  // 3. Compter avant
  const counts = {
    email_sequences: 0,
    seo_pages: 0,
    pros: allProIds.length,
    seo_guides: 0,
    categories: cats.length,
  };

  // email_sequences (paginé sur pro_id)
  for (let i = 0; i < allProIds.length; i += 500) {
    const chunk = allProIds.slice(i, i + 500);
    const { count } = await supabase
      .from("email_sequences")
      .select("id", { count: "exact", head: true })
      .in("pro_id", chunk);
    counts.email_sequences += count || 0;
  }

  // seo_pages
  const { count: seoCount } = await supabase
    .from("seo_pages")
    .select("id", { count: "exact", head: true })
    .in("category_id", catIds);
  counts.seo_pages = seoCount || 0;

  // seo_guides
  const { count: guidesCount } = await supabase
    .from("seo_guides")
    .select("id", { count: "exact", head: true })
    .in("category_id", catIds);
  counts.seo_guides = guidesCount || 0;

  console.log("=== À SUPPRIMER ===");
  console.log(`  email_sequences : ${counts.email_sequences}`);
  console.log(`  seo_pages       : ${counts.seo_pages}`);
  console.log(`  pros            : ${counts.pros}`);
  console.log(`  seo_guides      : ${counts.seo_guides}`);
  console.log(`  categories      : ${counts.categories}`);
  console.log();

  if (isDryRun) {
    console.log("✅ DRY-RUN terminé. Relancer avec --execute pour appliquer.");
    return;
  }

  // ============================================
  // EXECUTE
  // ============================================

  // Étape 1 : DELETE email_sequences (paginé)
  console.log("Étape 1/4 : DELETE email_sequences...");
  let deletedSeqs = 0;
  for (let i = 0; i < allProIds.length; i += 500) {
    const chunk = allProIds.slice(i, i + 500);
    const { error, count } = await supabase
      .from("email_sequences")
      .delete({ count: "exact" })
      .in("pro_id", chunk);
    if (error) {
      console.error("  Erreur :", error.message);
      process.exit(1);
    }
    deletedSeqs += count || 0;
  }
  console.log(`  ✅ ${deletedSeqs} email_sequences supprimées\n`);

  // Étape 2 : DELETE seo_pages
  console.log("Étape 2/4 : DELETE seo_pages...");
  const { error: seoErr, count: seoDel } = await supabase
    .from("seo_pages")
    .delete({ count: "exact" })
    .in("category_id", catIds);
  if (seoErr) {
    console.error("  Erreur :", seoErr.message);
    process.exit(1);
  }
  console.log(`  ✅ ${seoDel} seo_pages supprimées\n`);

  // Étape 3 : DELETE pros (paginé pour éviter les timeouts)
  console.log("Étape 3/5 : DELETE pros...");
  let deletedPros = 0;
  for (let i = 0; i < allProIds.length; i += 500) {
    const chunk = allProIds.slice(i, i + 500);
    const { error, count } = await supabase
      .from("pros")
      .delete({ count: "exact" })
      .in("id", chunk);
    if (error) {
      console.error("  Erreur :", error.message);
      process.exit(1);
    }
    deletedPros += count || 0;
  }
  console.log(`  ✅ ${deletedPros} pros supprimés\n`);

  // Étape 4 : DELETE seo_guides (FK sur categories.id)
  console.log("Étape 4/5 : DELETE seo_guides...");
  const { error: guidesErr, count: guidesDel } = await supabase
    .from("seo_guides")
    .delete({ count: "exact" })
    .in("category_id", catIds);
  if (guidesErr) {
    console.error("  Erreur :", guidesErr.message);
    process.exit(1);
  }
  console.log(`  ✅ ${guidesDel} seo_guides supprimés\n`);

  // Étape 5 : DELETE categories
  console.log("Étape 5/5 : DELETE categories...");
  const { error: catErr, count: catDel } = await supabase
    .from("categories")
    .delete({ count: "exact" })
    .in("id", catIds);
  if (catErr) {
    console.error("  Erreur :", catErr.message);
    process.exit(1);
  }
  console.log(`  ✅ ${catDel} categories supprimées\n`);

  // Vérif finale
  console.log("=== VÉRIFICATION POST-CLEANUP ===");
  const { count: catRemain } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .in("slug", TO_DROP);
  const { count: proRemain } = await supabase
    .from("pros")
    .select("id", { count: "exact", head: true })
    .in("category_id", catIds);
  console.log(`  categories restantes (slugs droppées) : ${catRemain} (attendu : 0)`);
  console.log(`  pros restants (cat_ids droppées)      : ${proRemain} (attendu : 0)`);

  if (catRemain === 0 && proRemain === 0) {
    console.log("\n✅ Cleanup terminé avec succès.");
  } else {
    console.log("\n⚠ Cleanup partiel — investiguer.");
  }
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
