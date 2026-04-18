/**
 * Genere 15 articles de blog "prix" en batch sur des requetes long-tail
 * a fort volume (Phase A3 SEO).
 *
 * Cibles :
 *  - 7 articles prix pour les 7 nouvelles categories (pisciniste, vitrier...)
 *  - 8 articles prix sur les long-tail haute valeur (placo, tarif horaire elec...)
 *
 * Bypass la blog_queue : insertion directe dans blog_posts (status published).
 *
 * Usage :
 *   npx tsx scripts/generate-price-guides.ts --dry-run    # preview
 *   npx tsx scripts/generate-price-guides.ts              # production
 *   npx tsx scripts/generate-price-guides.ts --only 3,7   # cibles specifiques
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { generateBlogArticle } from "../lib/ai/generate-blog";

// override:true requis : tsx pre-injecte certaines vars en blank, ce qui empeche
// dotenv d'ecraser sans override (cas de ANTHROPIC_API_KEY).
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type GuideSpec = {
  id: number;
  categorySlug: string;
  titleSuggestion: string;
  estimatedVolume: number; // vol/mois Google FR
};

// 15 articles prix prioritaires (vol/mois estime entre parentheses)
const GUIDES: GuideSpec[] = [
  // 7 nouvelles categories
  { id: 1, categorySlug: "pisciniste",                    titleSuggestion: "Prix construction piscine en 2026 : coque, beton, monobloc — guide complet",                estimatedVolume: 12000 },
  { id: 2, categorySlug: "vitrier",                       titleSuggestion: "Prix vitrier urgence 2026 : remplacement vitre cassee, devis et tarifs",                   estimatedVolume: 8000 },
  { id: 3, categorySlug: "ramoneur",                      titleSuggestion: "Prix ramonage cheminee 2026 : tarif, obligations legales et astuces",                       estimatedVolume: 5000 },
  { id: 4, categorySlug: "videosurveillance-installateur", titleSuggestion: "Prix installation alarme et videosurveillance maison 2026 : guide complet",                estimatedVolume: 8000 },
  { id: 5, categorySlug: "nettoyage-pro",                 titleSuggestion: "Prix nettoyage bureaux 2026 : tarif au m2, forfait mensuel et devis",                       estimatedVolume: 4000 },
  { id: 6, categorySlug: "cuisiniste",                    titleSuggestion: "Prix cuisine sur mesure 2026 : cout, fourchettes et conseils pour economiser",              estimatedVolume: 8000 },
  { id: 7, categorySlug: "cheministe",                    titleSuggestion: "Prix poele a granules en 2026 : installation, MaPrimeRenov' et economies d'energie",        estimatedVolume: 5000 },

  // 8 long-tail haute valeur sur categories existantes
  { id: 8,  categorySlug: "plaquiste",   titleSuggestion: "Prix au m2 placoplatre en 2026 : pose, fourniture, fourchettes completes",       estimatedVolume: 15000 },
  { id: 9,  categorySlug: "electricien", titleSuggestion: "Tarif horaire electricien en 2026 : prix moyen, deplacement et facturation",       estimatedVolume: 12000 },
  { id: 10, categorySlug: "carreleur",   titleSuggestion: "Prix pose carrelage au m2 en 2026 : sol, mur, salle de bain — toutes fourchettes", estimatedVolume: 10000 },
  { id: 11, categorySlug: "peintre",     titleSuggestion: "Prix peinture interieure au m2 en 2026 : tarifs, devis types et astuces",          estimatedVolume: 8000 },
  { id: 12, categorySlug: "plombier",    titleSuggestion: "Prix debouchage canalisation 2026 : tarif urgence et intervention plombier",       estimatedVolume: 10000 },
  { id: 13, categorySlug: "facadier",    titleSuggestion: "Prix isolation exterieure (ITE) en 2026 : cout au m2 et aides financieres",        estimatedVolume: 7000 },
  { id: 14, categorySlug: "paysagiste",  titleSuggestion: "Prix creation terrasse bois 2026 : tarif au m2, bois exotique vs composite",       estimatedVolume: 6000 },
  { id: 15, categorySlug: "menuisier",   titleSuggestion: "Prix pose porte d'entree 2026 : PVC, alu, bois — fourchettes completes",           estimatedVolume: 5000 },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyArg = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
  const only = onlyArg ? onlyArg.split(",").map((s) => parseInt(s.trim(), 10)) : null;
  return { dryRun, only };
}

async function main() {
  const { dryRun, only } = parseArgs();

  const targets = only ? GUIDES.filter((g) => only.includes(g.id)) : GUIDES;

  if (targets.length === 0) {
    console.error("Aucune cible a generer (--only invalide ?)");
    process.exit(1);
  }

  console.log(`\nMode : ${dryRun ? "DRY-RUN (aucune insertion)" : "PRODUCTION"}`);
  console.log(`Cibles : ${targets.length} articles\n`);

  // Pre-charger les categories pour resoudre les noms
  const categorySlugs = targets.map((t) => t.categorySlug);
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name")
    .in("slug", categorySlugs);

  const categoryByName = new Map<string, string>(
    (categories || []).map((c) => [c.slug as string, c.name as string])
  );

  // Pre-verifier les slugs existants pour eviter doublons
  const { data: existingPosts } = await supabase
    .from("blog_posts")
    .select("slug")
    .in("status", ["published", "draft"]);
  const existingSlugs = new Set((existingPosts || []).map((p) => p.slug as string));
  console.log(`Articles deja en base : ${existingSlugs.size}`);

  let generated = 0;
  let skipped = 0;
  let errors = 0;
  const totalEstimatedVolume = targets.reduce((sum, g) => sum + g.estimatedVolume, 0);

  for (const guide of targets) {
    const categoryName = categoryByName.get(guide.categorySlug);
    if (!categoryName) {
      console.error(`  [#${guide.id}] Categorie introuvable : ${guide.categorySlug} — SKIP`);
      errors++;
      continue;
    }

    // Pre-verifier si un slug similaire existe deja (heuristique : titre commence par "prix" et categorySlug present)
    const expectedSlugStart = `prix-`;
    const conflictCandidate = Array.from(existingSlugs).find(
      (s) => s.startsWith(expectedSlugStart) && s.includes(guide.categorySlug.split("-")[0])
    );
    if (conflictCandidate) {
      console.log(`  [#${guide.id}] [${categoryName}] Conflit potentiel : ${conflictCandidate} — SKIP`);
      skipped++;
      continue;
    }

    console.log(`  [#${guide.id}] [${categoryName}] (~${guide.estimatedVolume.toLocaleString("fr-FR")} vol/mois)`);
    console.log(`         "${guide.titleSuggestion}"`);

    if (dryRun) {
      console.log(`         [DRY-RUN] Skip generation\n`);
      continue;
    }

    try {
      // Generation via Claude (article + meta)
      const article = await generateBlogArticle({
        categoryName,
        categorySlug: guide.categorySlug,
        topicType: "prix",
        titleSuggestion: guide.titleSuggestion,
        // pas de cityName : article national pour max volume SEO
      });

      // Verifier le slug genere n'entre pas en conflit
      const finalSlug = existingSlugs.has(article.slug)
        ? `${article.slug}-${Date.now()}`
        : article.slug;

      const { error } = await supabase
        .from("blog_posts")
        .insert({
          slug: finalSlug,
          title: article.title,
          meta_description: article.metaDescription,
          content: article.content,
          category_slug: guide.categorySlug,
          city_slug: null,
          tags: article.tags,
          status: "published",
          published_at: new Date().toISOString(),
        });

      if (error) {
        console.error(`         ERREUR insertion : ${error.message}\n`);
        errors++;
      } else {
        existingSlugs.add(finalSlug);
        console.log(`         OK → /blog/${finalSlug}\n`);
        generated++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      console.error(`         ERREUR generation : ${message}\n`);
      errors++;
    }

    // Rate limit anti-burst Anthropic (1.5s entre articles)
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n=== Resume ===");
  console.log(`Generes  : ${generated}`);
  console.log(`Sautes   : ${skipped}`);
  console.log(`Erreurs  : ${errors}`);
  console.log(`Volume estime capte : ~${totalEstimatedVolume.toLocaleString("fr-FR")} vol/mois`);
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
