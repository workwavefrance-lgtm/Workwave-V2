/**
 * Genere 15 articles de blog "guide pratique" en batch sur des requetes
 * long-tail informationnelles (Phase A4 SEO).
 *
 * Complementaire a A3 (guides prix = transactionnel).
 * A4 vise le search intent informationnel : "comment choisir...", "comment
 * trouver...", "comment eviter les arnaques...". Capte l'utilisateur EN AMONT
 * du parcours de decision.
 *
 * Cibles :
 *  - 10 articles "comment choisir un X" (metiers non couverts par A3)
 *  - 5 articles transversaux haute valeur (devis, aides, arnaques)
 *
 * Usage :
 *   npx tsx scripts/generate-howto-guides.ts --dry-run
 *   npx tsx scripts/generate-howto-guides.ts
 *   npx tsx scripts/generate-howto-guides.ts --only 1,5,10
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { generateBlogArticle } from "../lib/ai/generate-blog";

// override:true requis : tsx pre-injecte certaines vars en blank
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type GuideSpec = {
  id: number;
  categorySlug: string | null; // null pour articles transversaux
  topicType: "guide" | "checklist" | "reglementation";
  titleSuggestion: string;
  estimatedVolume: number; // vol/mois Google FR
};

// 15 guides A4 long-tail informationnels
const GUIDES: GuideSpec[] = [
  // 10 guides "comment choisir un X" — metiers non couverts par A3
  { id: 1,  categorySlug: "macon",            topicType: "guide", titleSuggestion: "Comment choisir un macon en 2026 : 7 criteres pour eviter les mauvaises surprises", estimatedVolume: 4000 },
  { id: 2,  categorySlug: "couvreur",         topicType: "guide", titleSuggestion: "Comment choisir un couvreur fiable en 2026 : labels, devis, garanties",            estimatedVolume: 3500 },
  { id: 3,  categorySlug: "chauffagiste",     topicType: "guide", titleSuggestion: "Comment choisir un chauffagiste en 2026 : RGE, marques, types de chaudiere",       estimatedVolume: 5000 },
  { id: 4,  categorySlug: "serrurier",        topicType: "guide", titleSuggestion: "Comment choisir un serrurier en 2026 : eviter les arnaques, prix moyens",          estimatedVolume: 6000 },
  { id: 5,  categorySlug: "climaticien",      topicType: "guide", titleSuggestion: "Comment choisir un climaticien en 2026 : QualiPAC, marques, dimensionnement",      estimatedVolume: 3000 },
  { id: 6,  categorySlug: "elagueur",         topicType: "guide", titleSuggestion: "Comment choisir un elagueur en 2026 : assurance, certification SS3, devis types",  estimatedVolume: 2500 },
  { id: 7,  categorySlug: "architecte",       topicType: "guide", titleSuggestion: "Comment choisir un architecte pour sa maison en 2026 : honoraires, references",    estimatedVolume: 4000 },
  { id: 8,  categorySlug: "menage",           topicType: "guide", titleSuggestion: "Comment choisir une societe de menage a domicile en 2026 : criteres, avantages CESU", estimatedVolume: 3500 },
  { id: 9,  categorySlug: "garde-enfants",    topicType: "guide", titleSuggestion: "Comment choisir une garde d'enfants a domicile en 2026 : agrement, contrat, prix", estimatedVolume: 5000 },
  { id: 10, categorySlug: "aide-seniors",     topicType: "guide", titleSuggestion: "Comment choisir une aide a domicile pour senior en 2026 : APA, agrement, criteres", estimatedVolume: 4500 },

  // 5 articles transversaux haute valeur
  { id: 11, categorySlug: null,               topicType: "checklist",     titleSuggestion: "Comment lire un devis travaux en 2026 : les 12 points a verifier absolument",     estimatedVolume: 8000 },
  { id: 12, categorySlug: null,               topicType: "guide",         titleSuggestion: "Comment eviter les arnaques travaux en 2026 : 10 signaux d'alerte",               estimatedVolume: 6000 },
  { id: 13, categorySlug: null,               topicType: "reglementation", titleSuggestion: "MaPrimeRenov 2026 : montants, conditions, demarches — guide complet",            estimatedVolume: 35000 },
  { id: 14, categorySlug: null,               topicType: "guide",         titleSuggestion: "Aides a la renovation energetique 2026 : MaPrimeRenov, CEE, eco-PTZ — comparatif", estimatedVolume: 15000 },
  { id: 15, categorySlug: null,               topicType: "checklist",     titleSuggestion: "Reception des travaux : checklist complete des points a verifier en 2026",         estimatedVolume: 4000 },
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

  // Pre-charger les categories pour resoudre les noms (uniquement les non-null)
  const categorySlugs = targets
    .map((t) => t.categorySlug)
    .filter((s): s is string => s !== null);
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
    // Resoudre le nom de la categorie ou utiliser un libelle generique
    let categoryName: string;
    if (guide.categorySlug) {
      const resolved = categoryByName.get(guide.categorySlug);
      if (!resolved) {
        console.error(`  [#${guide.id}] Categorie introuvable : ${guide.categorySlug} — SKIP`);
        errors++;
        continue;
      }
      categoryName = resolved;
    } else {
      // Article transversal : pas de categorie = "renovation" generique
      categoryName = "Renovation et travaux";
    }

    // Pre-verifier conflit de slug : pour les "comment choisir", verifier
    // qu'il n'y a pas deja un article avec ce categorySlug et le mot-cle "choisir"
    if (guide.categorySlug) {
      const conflictCandidate = Array.from(existingSlugs).find(
        (s) => s.includes("choisir") && s.includes(guide.categorySlug!.split("-")[0])
      );
      if (conflictCandidate) {
        console.log(`  [#${guide.id}] [${categoryName}] Conflit potentiel : ${conflictCandidate} — SKIP`);
        skipped++;
        continue;
      }
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
        categorySlug: guide.categorySlug || "renovation",
        topicType: guide.topicType,
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
          category_slug: guide.categorySlug, // null pour transversaux
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
        console.log(`         OK -> /blog/${finalSlug}\n`);
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
