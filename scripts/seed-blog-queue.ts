/**
 * Remplit la table blog_queue avec des sujets d'articles.
 *
 * Strategie SEO (audit 2026-05-03) :
 *  - Rotation sur les 12 departements de Nouvelle-Aquitaine (pas Vienne hardcode)
 *  - Pour chaque combo cat x topic, on genere 12 articles par chef-lieu
 *    (= 1 par departement) + 1 article generique national (city_slug=null)
 *  - Total : 38 cat x 5 topic x (12 chef-lieux + 1 national) = 38 x 5 x 13 = 2470
 *  - A 1 article/jour, ~6,8 ans de stock. La queue se vide naturellement,
 *    on peut wiper et re-seeder a tout moment.
 *
 * Pourquoi chef-lieu et pas dept abstrait :
 *  - Le cron daily-blog passe city_slug + city_name a generateBlogArticle()
 *  - Si on stocke city_slug = chef-lieu, le cron genere un article tres
 *    SEO local (ex. "Comment trouver un plombier a Bordeaux") sans avoir
 *    a modifier ni le cron ni lib/ai/generate-blog.ts
 *  - 1 article par chef-lieu de departement = couverture geographique des 12 dept
 *
 * Usage :
 *   npx tsx scripts/seed-blog-queue.ts                    # ajoute les nouveaux sujets (dedup)
 *   npx tsx scripts/seed-blog-queue.ts --wipe-pending     # supprime les pending et re-seed total
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TOPIC_TYPES = [
  "guide",
  "prix",
  "checklist",
  "comparaison",
  "reglementation",
] as const;

const WIPE = process.argv.includes("--wipe-pending");

async function main() {
  // ---------- 1. Charger les categories
  const { data: categoriesRaw } = await supabase
    .from("categories")
    .select("slug, name")
    .order("name");
  const categories = (categoriesRaw || []) as { slug: string; name: string }[];

  if (categories.length === 0) {
    console.error("Aucune categorie trouvee");
    process.exit(1);
  }

  // ---------- 2. Charger les 12 departements + chef-lieu (= ville la plus
  //              peuplee par dept). Une query par dept pour avoir le top 1
  //              meme pour les depts a faible population (ex. Creuse / Gueret
  //              n'apparait pas dans le top 50 villes de la region).
  const { data: deptsRaw } = await supabase
    .from("departments")
    .select("id, code, name")
    .order("code");
  const depts = (deptsRaw || []) as { id: number; code: string; name: string }[];
  console.log(`${depts.length} departements charges`);

  const chefLieux: {
    deptId: number;
    deptCode: string;
    deptName: string;
    citySlug: string;
    cityName: string;
  }[] = [];
  for (const d of depts) {
    const { data: cityRaw } = await supabase
      .from("cities")
      .select("slug, name, population")
      .eq("department_id", d.id)
      .not("population", "is", null)
      .order("population", { ascending: false })
      .limit(1)
      .single();
    const city = cityRaw as { slug: string; name: string; population: number } | null;
    if (city) {
      chefLieux.push({
        deptId: d.id,
        deptCode: d.code,
        deptName: d.name,
        citySlug: city.slug,
        cityName: city.name,
      });
      console.log(
        `  ${d.code} ${d.name.padEnd(22)} -> ${city.name} (${city.slug})`
      );
    }
  }

  if (chefLieux.length !== depts.length) {
    console.warn(
      `ATTENTION : ${depts.length - chefLieux.length} dept(s) sans chef-lieu detecte`
    );
  }

  // ---------- 3. Wipe pending si demande
  if (WIPE) {
    console.log("\n[--wipe-pending] Suppression des sujets pending...");
    const { error: delErr, count } = await supabase
      .from("blog_queue")
      .delete({ count: "exact" })
      .eq("status", "pending");
    if (delErr) {
      console.error("Erreur wipe :", delErr);
      process.exit(1);
    }
    console.log(`  ${count ?? "?"} sujets pending supprimes`);
  }

  // ---------- 4. Charger l'existant (pour dedup en mode non-wipe et eviter
  //              les conflits avec les generes/failed qu'on garde)
  const { data: existingRaw } = await supabase
    .from("blog_queue")
    .select("category_slug, city_slug, topic_type");
  const existing = (existingRaw || []) as {
    category_slug: string;
    city_slug: string | null;
    topic_type: string;
  }[];
  const existingSet = new Set(
    existing.map((e) => `${e.category_slug}|${e.city_slug || ""}|${e.topic_type}`)
  );

  // ---------- 5. Construire les nouveaux sujets
  const rows: {
    category_slug: string;
    city_slug: string | null;
    topic_type: string;
    title_suggestion: string;
    priority: number;
  }[] = [];

  for (const cat of categories) {
    for (const topicType of TOPIC_TYPES) {
      // ---------- 5a. 1 article generique national (city_slug = null)
      const keyGeneric = `${cat.slug}||${topicType}`;
      if (!existingSet.has(keyGeneric)) {
        rows.push({
          category_slug: cat.slug,
          city_slug: null,
          topic_type: topicType,
          title_suggestion: generateTitle(cat.name, null, null, topicType),
          priority: topicType === "guide" ? 10 : topicType === "prix" ? 20 : 50,
        });
      }

      // ---------- 5b. 1 article par chef-lieu de departement (12)
      for (const cl of chefLieux) {
        const key = `${cat.slug}|${cl.citySlug}|${topicType}`;
        if (!existingSet.has(key)) {
          rows.push({
            category_slug: cat.slug,
            city_slug: cl.citySlug,
            topic_type: topicType,
            title_suggestion: generateTitle(
              cat.name,
              cl.cityName,
              cl.deptName,
              topicType
            ),
            priority: topicType === "guide" ? 15 : topicType === "prix" ? 25 : 60,
          });
        }
      }
    }
  }

  console.log(`\n${rows.length} nouveaux sujets a inserer`);

  if (rows.length === 0) {
    console.log("Queue deja a jour, rien a inserer.");
    return;
  }

  // ---------- 6. Inserer par batch de 100
  let totalInserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabase.from("blog_queue").insert(batch);
    if (error) {
      console.error(`Erreur batch ${i}:`, error.message);
    } else {
      totalInserted += batch.length;
      if ((i / 100) % 5 === 0) {
        console.log(`  Inseres jusqu'ici : ${totalInserted}/${rows.length}`);
      }
    }
  }

  console.log(`\nTermine : ${totalInserted} sujets inseres dans blog_queue.`);
  console.log(`Repartition cible :`);
  console.log(`  - articles nationaux         : ${categories.length} cat x ${TOPIC_TYPES.length} topics = ${categories.length * TOPIC_TYPES.length}`);
  console.log(`  - articles par chef-lieu     : ${categories.length} cat x ${TOPIC_TYPES.length} topics x ${chefLieux.length} dept = ${categories.length * TOPIC_TYPES.length * chefLieux.length}`);
  console.log(`  - total cible (si wipe)      : ${categories.length * TOPIC_TYPES.length * (1 + chefLieux.length)}`);
}

function generateTitle(
  categoryName: string,
  cityName: string | null,
  deptName: string | null,
  topicType: string
): string {
  const cat = categoryName.toLowerCase();
  // Article par ville (chef-lieu) : ancrage SEO local (ex. "a Bordeaux")
  // Article national : pas de hardcode "en Vienne". On dit "en France" ou
  // on omet la zone geo selon le topic.
  const location = cityName
    ? ` a ${cityName}${deptName ? ` (${deptName})` : ""}`
    : "";

  switch (topicType) {
    case "guide":
      return cityName
        ? `Comment trouver un bon ${cat}${location}`
        : `Comment trouver un bon ${cat} : guide complet`;
    case "prix":
      return cityName
        ? `Prix ${cat}${location} : tarifs 2026`
        : `Prix ${cat} en France : tarifs et fourchettes 2026`;
    case "checklist":
      return cityName
        ? `Checklist avant de faire appel a un ${cat}${location}`
        : `Checklist avant de faire appel a un ${cat} : 10 points a verifier`;
    case "comparaison":
      return cityName
        ? `${categoryName}${location} : comment comparer les devis`
        : `${categoryName} : comment comparer les devis et faire le bon choix`;
    case "reglementation":
      return `${categoryName}${location ? ` ${location.trim()}` : ""} : reglementation et obligations legales en 2026`;
    default:
      return `Tout savoir sur les ${cat}s${location}`;
  }
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
