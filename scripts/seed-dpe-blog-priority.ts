/**
 * Insert 12 articles blog "renovation energetique" prioritaires dans
 * blog_queue. Un article par chef-lieu de departement Nouvelle-Aquitaine,
 * avec priority=2 (passe en premier dans la file du cron daily-blog).
 *
 * Ces articles ciblent des requetes SEO long-tail tres porteuses :
 *   - "renovation energetique [ville] prix"
 *   - "MaPrimeRenov [ville] 2026"
 *   - "pompe a chaleur [ville] prix"
 * (volume et CPC eleves sur AdWords = signal SEO fort)
 *
 * Run :
 *   npx tsx scripts/seed-dpe-blog-priority.ts
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

// 12 articles cibles, un par chef-lieu, avec titre custom long-tail
// fortement competitif sur AdWords (= signal de valeur SEO)
const ARTICLES: {
  citySlug: string;
  categorySlug: string;
  topicType: string;
  title: string;
}[] = [
  {
    citySlug: "bordeaux",
    categorySlug: "chauffagiste",
    topicType: "prix",
    title: "Rénovation énergétique à Bordeaux : prix, aides et démarches 2026",
  },
  {
    citySlug: "limoges",
    categorySlug: "chauffagiste",
    topicType: "prix",
    title: "MaPrimeRénov' à Limoges : montants et travaux éligibles 2026",
  },
  {
    citySlug: "poitiers",
    categorySlug: "chauffagiste",
    topicType: "prix",
    title: "Combien coûte une rénovation énergétique à Poitiers en 2026 ?",
  },
  {
    citySlug: "pau",
    categorySlug: "chauffagiste",
    topicType: "prix",
    title: "Pompe à chaleur à Pau : prix, aides et installateurs RGE 2026",
  },
  {
    citySlug: "niort",
    categorySlug: "menuisier",
    topicType: "prix",
    title: "Isolation des combles à Niort : tarifs et aides 2026",
  },
  {
    citySlug: "angouleme",
    categorySlug: "chauffagiste",
    topicType: "guide",
    title: "DPE F ou G à Angoulême : travaux obligatoires et prix 2026",
  },
  {
    citySlug: "la-rochelle",
    categorySlug: "chauffagiste",
    topicType: "prix",
    title: "Chaudière à granulés à La Rochelle : prix, MaPrimeRénov' et installation 2026",
  },
  {
    citySlug: "brive-la-gaillarde",
    categorySlug: "chauffagiste",
    topicType: "guide",
    title: "Rénovation énergétique à Brive-la-Gaillarde : aides locales et nationales 2026",
  },
  {
    citySlug: "perigueux",
    categorySlug: "menuisier",
    topicType: "prix",
    title: "Isolation thermique à Périgueux : prix au m² et aides 2026",
  },
  {
    citySlug: "mont-de-marsan",
    categorySlug: "chauffagiste",
    topicType: "guide",
    title: "Pompe à chaleur air-eau à Mont-de-Marsan : guide complet 2026",
  },
  {
    citySlug: "agen",
    categorySlug: "chauffagiste",
    topicType: "comparaison",
    title: "Chauffage électrique vs pompe à chaleur à Agen : comparatif 2026",
  },
  {
    citySlug: "gueret",
    categorySlug: "chauffagiste",
    topicType: "guide",
    title: "Rénovation énergétique à Guéret : aides Creuse et MaPrimeRénov' 2026",
  },
];

async function main() {
  console.log(`=== Seed ${ARTICLES.length} articles blog DPE/renovation prioritaires ===\n`);

  // Verifier que les couples existent et qu'on n'a pas deja insere ces sujets
  const { data: existing } = await supabase
    .from("blog_queue")
    .select("category_slug, city_slug, topic_type, title_suggestion")
    .in(
      "city_slug",
      ARTICLES.map((a) => a.citySlug)
    );

  const existingSet = new Set(
    (existing || []).map(
      (e) => `${e.category_slug}|${e.city_slug}|${e.title_suggestion}`
    )
  );

  const rows = ARTICLES.filter(
    (a) => !existingSet.has(`${a.categorySlug}|${a.citySlug}|${a.title}`)
  ).map((a) => ({
    category_slug: a.categorySlug,
    city_slug: a.citySlug,
    topic_type: a.topicType,
    title_suggestion: a.title,
    priority: 2, // top priority (apres les eventuels priority=1 qui n'existent pas)
  }));

  if (rows.length === 0) {
    console.log("Tous les articles sont deja presents en queue.");
    return;
  }

  console.log(`${rows.length} nouveaux articles a inserer (top priority=2) :`);
  for (const r of rows) {
    console.log(`  [${r.city_slug.padEnd(20)}] ${r.title_suggestion}`);
  }

  const { error } = await supabase.from("blog_queue").insert(rows);
  if (error) {
    console.error("Erreur insert :", error);
    process.exit(1);
  }

  console.log(
    `\n${rows.length} articles inseres. Le cron daily-blog les pioera en premier (priority=2).`
  );
  console.log(
    `A raison de 1/jour, les 12 articles seront publies sous ${rows.length} jours.`
  );
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
