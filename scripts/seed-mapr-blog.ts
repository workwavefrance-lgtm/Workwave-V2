/**
 * Insert 12 articles blog "Guide MaPrimeRenov' [dept]" prioritaires
 * dans blog_queue. Un article par departement Nouvelle-Aquitaine.
 *
 * Strategie : capture les requetes commerciales ultra qualifiees
 *   "MaPrimeRenov' Vienne 2026"
 *   "Aides renovation energetique Gironde"
 *   "Subventions ANAH Charente-Maritime"
 * (CPC eleve sur AdWords = signal de valeur SEO fort, requetes
 * d'intention transactionnelle).
 *
 * Le contenu sera genere automatiquement par le cron daily-blog
 * qui utilisera le titre et le city_slug (chef-lieu de dept) comme
 * contexte. Claude generera le corps de l'article incluant chiffres
 * officiels ANAH 2024, eligibilite, demarches, et liste des artisans
 * RGE locaux.
 *
 * Run :
 *   npx tsx scripts/seed-mapr-blog.ts
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

// Un article par dept, avec city_slug = chef-lieu de dept (pour que
// le cron puisse contextualiser le contenu sur cette zone).
// Le titre est formate pour cibler les requetes "MaPrimeRenov [dept]".
const ARTICLES: { citySlug: string; deptName: string; title: string }[] = [
  { citySlug: "angouleme", deptName: "Charente", title: "MaPrimeRénov' en Charente : aides 2026, montants et démarches" },
  { citySlug: "la-rochelle", deptName: "Charente-Maritime", title: "MaPrimeRénov' en Charente-Maritime : guide complet 2026" },
  { citySlug: "brive-la-gaillarde", deptName: "Corrèze", title: "Aides à la rénovation énergétique en Corrèze : MaPrimeRénov' 2026" },
  { citySlug: "gueret", deptName: "Creuse", title: "MaPrimeRénov' en Creuse : montants, éligibilité et démarches 2026" },
  { citySlug: "perigueux", deptName: "Dordogne", title: "Aides ANAH en Dordogne : MaPrimeRénov' et subventions 2026" },
  { citySlug: "bordeaux", deptName: "Gironde", title: "MaPrimeRénov' en Gironde : guide 2026 pour les Girondins" },
  { citySlug: "mont-de-marsan", deptName: "Landes", title: "Subventions rénovation énergétique dans les Landes : MaPrimeRénov' 2026" },
  { citySlug: "agen", deptName: "Lot-et-Garonne", title: "MaPrimeRénov' en Lot-et-Garonne : montants et travaux éligibles 2026" },
  { citySlug: "pau", deptName: "Pyrénées-Atlantiques", title: "Aides à la rénovation dans les Pyrénées-Atlantiques : MaPrimeRénov' 2026" },
  { citySlug: "niort", deptName: "Deux-Sèvres", title: "MaPrimeRénov' dans les Deux-Sèvres : guide complet 2026" },
  { citySlug: "poitiers", deptName: "Vienne", title: "MaPrimeRénov' en Vienne : aides 2026 pour la rénovation énergétique" },
  { citySlug: "limoges", deptName: "Haute-Vienne", title: "MaPrimeRénov' en Haute-Vienne : montants, démarches et artisans RGE 2026" },
];

async function main() {
  console.log(`=== Seed ${ARTICLES.length} articles MaPrimeRenov par departement ===\n`);

  // Dedup
  const { data: existing } = await supabase
    .from("blog_queue")
    .select("title_suggestion")
    .in("city_slug", ARTICLES.map((a) => a.citySlug));

  const existingTitles = new Set(
    (existing || []).map((e) => e.title_suggestion)
  );

  // Categorie : on associe a chauffagiste (le plus pertinent pour
  // MaPrimeRenov : pompe a chaleur, chaudiere bois, etc.)
  const rows = ARTICLES.filter((a) => !existingTitles.has(a.title)).map((a) => ({
    category_slug: "chauffagiste",
    city_slug: a.citySlug,
    topic_type: "guide",
    title_suggestion: a.title,
    priority: 2, // top priority avec les 12 articles DPE deja seedes
  }));

  if (rows.length === 0) {
    console.log("Tous les articles deja en queue.");
    return;
  }

  console.log(`${rows.length} articles a inserer (priority=2) :`);
  for (const r of rows) {
    console.log(`  [${r.city_slug.padEnd(20)}] ${r.title_suggestion}`);
  }

  const { error } = await supabase.from("blog_queue").insert(rows);
  if (error) {
    console.error("Erreur insert :", error);
    process.exit(1);
  }

  console.log(
    `\n${rows.length} articles MaPrimeRenov inseres. Avec les 12 articles DPE deja en queue, on a maintenant 24 articles "renovation energetique" prioritaires.`
  );
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
