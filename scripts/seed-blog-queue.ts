/**
 * Remplit la table blog_queue avec des sujets d'articles.
 * Genere des combinaisons categorie x ville x type pour 365 articles.
 *
 * Usage : npx tsx scripts/seed-blog-queue.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TOPIC_TYPES = ["guide", "prix", "checklist", "comparaison", "reglementation"] as const;

async function main() {
  // Charger categories et top villes
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name")
    .order("name");

  const { data: cities } = await supabase
    .from("cities")
    .select("slug, name")
    .order("population", { ascending: false, nullsFirst: false })
    .limit(15);

  if (!categories || !cities) {
    console.error("Erreur chargement donnees");
    process.exit(1);
  }

  // Verifier les sujets existants
  const { data: existing } = await supabase
    .from("blog_queue")
    .select("category_slug, city_slug, topic_type");

  const existingSet = new Set(
    (existing || []).map(
      (e: { category_slug: string; city_slug: string | null; topic_type: string }) =>
        `${e.category_slug}|${e.city_slug || ""}|${e.topic_type}`
    )
  );

  const rows: {
    category_slug: string;
    city_slug: string | null;
    topic_type: string;
    title_suggestion: string;
    priority: number;
  }[] = [];

  // Pour chaque categorie, generer des sujets
  for (const cat of categories as { slug: string; name: string }[]) {
    for (const topicType of TOPIC_TYPES) {
      // Article generique (sans ville)
      const keyGeneric = `${cat.slug}||${topicType}`;
      if (!existingSet.has(keyGeneric)) {
        rows.push({
          category_slug: cat.slug,
          city_slug: null,
          topic_type: topicType,
          title_suggestion: generateTitle(cat.name, null, topicType),
          priority: topicType === "guide" ? 10 : topicType === "prix" ? 20 : 50,
        });
      }

      // Articles par ville (top 5 villes seulement pour limiter le volume)
      for (const city of (cities as { slug: string; name: string }[]).slice(0, 5)) {
        const key = `${cat.slug}|${city.slug}|${topicType}`;
        if (!existingSet.has(key)) {
          rows.push({
            category_slug: cat.slug,
            city_slug: city.slug,
            topic_type: topicType,
            title_suggestion: generateTitle(cat.name, city.name, topicType),
            priority: topicType === "guide" ? 15 : topicType === "prix" ? 25 : 60,
          });
        }
      }
    }
  }

  console.log(`${rows.length} sujets a inserer`);

  if (rows.length === 0) {
    console.log("Queue deja remplie !");
    return;
  }

  // Inserer par batch de 100
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabase.from("blog_queue").insert(batch);
    if (error) {
      console.error(`Erreur batch ${i}:`, error.message);
    } else {
      console.log(`  Batch ${i + 1}-${i + batch.length} insere`);
    }
  }

  console.log(`\nTermine : ${rows.length} sujets dans la queue`);
}

function generateTitle(
  categoryName: string,
  cityName: string | null,
  topicType: string
): string {
  const location = cityName ? ` a ${cityName}` : " en Vienne";

  switch (topicType) {
    case "guide":
      return `Comment trouver un bon ${categoryName.toLowerCase()}${location}`;
    case "prix":
      return `Prix ${categoryName.toLowerCase()}${location} : tarifs 2026`;
    case "checklist":
      return `Checklist avant de faire appel a un ${categoryName.toLowerCase()}${location}`;
    case "comparaison":
      return `${categoryName}${location} : comment comparer les devis`;
    case "reglementation":
      return `${categoryName} : reglementation et obligations legales en 2026`;
    default:
      return `Tout savoir sur les ${categoryName.toLowerCase()}s${location}`;
  }
}

main().catch(console.error);
