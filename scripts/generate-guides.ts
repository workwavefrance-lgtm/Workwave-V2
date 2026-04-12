/**
 * Genere les pages pilier (guides) pour toutes les categories.
 *
 * Usage :
 *   npx tsx scripts/generate-guides.ts                     # toutes
 *   npx tsx scripts/generate-guides.ts --single plombier   # une seule
 *   npx tsx scripts/generate-guides.ts --vertical btp      # un vertical
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { generateGuideContent } from "../lib/ai/generate-guide";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const args = process.argv.slice(2);
  const singleSlug = args.includes("--single") ? args[args.indexOf("--single") + 1] : null;
  const vertical = args.includes("--vertical") ? args[args.indexOf("--vertical") + 1] : null;

  // Charger les categories
  let query = supabase.from("categories").select("id, slug, name, vertical");
  if (singleSlug) query = query.eq("slug", singleSlug);
  if (vertical) query = query.eq("vertical", vertical);
  const { data: categories } = await query.order("name");

  if (!categories || categories.length === 0) {
    console.error("Aucune categorie trouvee");
    process.exit(1);
  }

  // Verifier les guides existants
  const { data: existingGuides } = await supabase
    .from("seo_guides")
    .select("slug");
  const existingSlugs = new Set((existingGuides || []).map((g: { slug: string }) => g.slug));

  // Departement principal
  const departmentName = "Vienne";

  console.log(`Categories a traiter : ${categories.length}`);
  console.log(`Guides existants : ${existingSlugs.size}`);

  let generated = 0;
  let skipped = 0;

  for (const cat of categories as { id: number; slug: string; name: string; vertical: string }[]) {
    if (existingSlugs.has(cat.slug)) {
      console.log(`  [${cat.name}] deja genere, skip`);
      skipped++;
      continue;
    }

    // Compter les pros
    const { count } = await supabase
      .from("pros")
      .select("*", { count: "exact", head: true })
      .eq("category_id", cat.id)
      .eq("is_active", true)
      .is("deleted_at", null);

    const prosCount = count || 0;

    console.log(`  [${cat.name}] ${prosCount} pros — generation en cours...`);

    try {
      const guide = await generateGuideContent({
        categoryName: cat.name,
        categorySlug: cat.slug,
        vertical: cat.vertical,
        departmentName,
        prosCount,
      });

      const { error } = await supabase.from("seo_guides").insert({
        category_id: cat.id,
        slug: cat.slug,
        title: guide.title,
        meta_description: guide.metaDescription,
        content: guide.content,
        table_of_contents: guide.tableOfContents,
      });

      if (error) {
        console.error(`    Erreur insertion ${cat.slug}:`, error.message);
      } else {
        generated++;
        console.log(`    OK (${guide.tableOfContents.length} sections)`);
      }
    } catch (err) {
      console.error(`    Erreur generation ${cat.slug}:`, err);
    }

    // Rate limit : 1s entre chaque
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\nTermine : ${generated} guides generes, ${skipped} deja existants`);
}

main().catch(console.error);
