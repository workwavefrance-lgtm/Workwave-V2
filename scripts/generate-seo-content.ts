/**
 * Script de generation de contenu SEO via Claude.
 *
 * Usage :
 *   npx tsx scripts/generate-seo-content.ts                    # toutes les combinaisons
 *   npx tsx scripts/generate-seo-content.ts --single plombier poitiers  # une seule page
 *   npx tsx scripts/generate-seo-content.ts --category plombier         # un metier, toutes les villes
 *
 * Prerequis : ANTHROPIC_API_KEY et SUPABASE credentials dans .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { generateSeoContent } from "../lib/ai/generate-seo";
import * as dotenv from "dotenv";
import * as path from "path";

// Charger .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Category = {
  id: number;
  slug: string;
  name: string;
};

type City = {
  id: number;
  slug: string;
  name: string;
  population: number | null;
  department_id: number;
};

type Department = {
  id: number;
  code: string;
  name: string;
};

async function countPros(
  categoryId: number,
  locationId: number,
  locationType: "city" | "department"
): Promise<number> {
  if (locationType === "city") {
    const { count } = await supabase
      .from("pros")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId)
      .eq("city_id", locationId);
    return count || 0;
  }

  // Department : on doit d'abord chercher les city_ids
  const { data: cities } = await supabase
    .from("cities")
    .select("id")
    .eq("department_id", locationId);

  if (!cities || cities.length === 0) return 0;

  const cityIds = cities.map((c: { id: number }) => c.id);
  const { count } = await supabase
    .from("pros")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .in("city_id", cityIds);
  return count || 0;
}

async function generateForPage(
  category: Category,
  location: City | Department,
  locationType: "city" | "department",
  department?: Department
) {
  const locationId =
    locationType === "city"
      ? (location as City).id
      : (location as Department).id;
  const locationSlugPart =
    locationType === "city"
      ? (location as City).slug
      : `${(location as Department).name.toLowerCase().replace(/\s+/g, "-")}-${(location as Department).code}`;
  const slug = `${category.slug}/${locationSlugPart}`;

  // Verifier si deja genere
  const { data: existing } = await supabase
    .from("seo_pages")
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`  SKIP ${slug} (déjà généré)`);
    return "skipped";
  }

  const prosCount = await countPros(category.id, locationId, locationType);

  if (prosCount === 0) {
    console.log(`  SKIP ${slug} (0 pros)`);
    return "skipped";
  }

  console.log(`  GENERATING ${slug} (${prosCount} pros)...`);

  const city = locationType === "city" ? (location as City) : null;
  const dept =
    locationType === "department" ? (location as Department) : department;

  const locationSlug =
    locationType === "city"
      ? (location as City).slug
      : `${(location as Department).name.toLowerCase().replace(/\s+/g, "-")}-${(location as Department).code}`;

  const result = await generateSeoContent({
    categoryName: category.name,
    categorySlug: category.slug,
    locationName:
      locationType === "city"
        ? (location as City).name
        : (location as Department).name,
    locationSlug,
    locationType,
    departmentName: dept?.name,
    departmentCode: dept?.code,
    population: city?.population,
    prosCount,
  });

  // Inserer en base
  const { error } = await supabase.from("seo_pages").insert({
    slug,
    type: locationType === "city" ? "metier_ville" : "metier_dept",
    category_id: category.id,
    city_id: city?.id || null,
    department_id: dept?.id || null,
    title: result.title,
    meta_description: result.metaDescription,
    content: result.content,
  });

  if (error) {
    console.error(`  ERROR ${slug}:`, error.message);
  } else {
    console.log(`  OK ${slug} — "${result.title}"`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isSingle = args[0] === "--single";
  const isCategoryOnly = args[0] === "--category";

  // Charger les donnees de reference
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name")
    .order("name");

  const { data: departments } = await supabase
    .from("departments")
    .select("id, code, name");

  const { data: topCities } = await supabase
    .from("cities")
    .select("id, slug, name, population, department_id")
    .order("population", { ascending: false, nullsFirst: false })
    .limit(20);

  if (!categories || !departments || !topCities) {
    console.error("Erreur lors du chargement des donnees de reference");
    process.exit(1);
  }

  const dept = departments[0] as Department;

  // Mode --single : une seule page
  if (isSingle && args[1] && args[2]) {
    const cat = (categories as Category[]).find((c) => c.slug === args[1]);
    const city = (topCities as City[]).find((c) => c.slug === args[2]);

    if (!cat) {
      console.error(`Catégorie "${args[1]}" non trouvée`);
      process.exit(1);
    }
    if (!city) {
      // Chercher dans toutes les villes
      const { data: allCity } = await supabase
        .from("cities")
        .select("id, slug, name, population, department_id")
        .eq("slug", args[2])
        .limit(1);

      if (!allCity || allCity.length === 0) {
        console.error(`Ville "${args[2]}" non trouvée`);
        process.exit(1);
      }
      await generateForPage(cat, allCity[0] as City, "city", dept);
    } else {
      await generateForPage(cat, city, "city", dept);
    }
    return;
  }

  // Mode --category : un metier, toutes les localisations
  if (isCategoryOnly && args[1]) {
    const cat = (categories as Category[]).find((c) => c.slug === args[1]);
    if (!cat) {
      console.error(`Catégorie "${args[1]}" non trouvée`);
      process.exit(1);
    }

    console.log(`\nGeneration pour ${cat.name}...`);

    // Departement
    await generateForPage(cat, dept, "department");
    await sleep(1000);

    // Top villes
    for (const city of topCities as City[]) {
      await generateForPage(cat, city, "city", dept);
      await sleep(1000);
    }
    return;
  }

  // Mode complet : toutes les combinaisons
  console.log(
    `\nGeneration SEO pour ${categories.length} categories x ${topCities.length + 1} localisations`
  );
  console.log(
    `Total estimé : ${categories.length * (topCities.length + 1)} pages\n`
  );

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const cat of categories as Category[]) {
    console.log(`\n[${cat.name}]`);

    // Departement
    try {
      const res = await generateForPage(cat, dept, "department");
      if (res === "skipped") skipped++;
      else generated++;
    } catch (e) {
      console.error(`  FAIL ${cat.slug}/dept:`, (e as Error).message);
      failed++;
    }
    await sleep(1000);

    // Top villes
    for (const city of topCities as City[]) {
      try {
        const res = await generateForPage(cat, city, "city", dept);
        if (res === "skipped") skipped++;
        else generated++;
      } catch (e) {
        console.error(
          `  FAIL ${cat.slug}/${city.slug}:`,
          (e as Error).message
        );
        failed++;
      }
      await sleep(1000);
    }
  }

  console.log(`\nTerminé. ${generated} pages générées, ${skipped} skippées, ${failed} échecs.`);
}

main().catch(console.error);
