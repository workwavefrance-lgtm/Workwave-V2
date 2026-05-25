/**
 * Genere du contenu SEO UNIQUE pour chaque page /ai/[skill]/[ville].
 *
 * Pour chaque (category, city) tuple :
 *   1. Genere via Claude (claude-sonnet-4-6) un JSON structure avec :
 *      - intro_html : 300-450 mots, contexte local + skill specifique,
 *        chiffres reels (population, freelances, TJM), pas du generique
 *      - faq : 4-5 questions UNIQUES adaptees au skill + ville
 *      - stats : tjm_min, tjm_median, tjm_max, total_freelances
 *      - meta_title : title clickbait optimal pour CTR
 *      - meta_description : meta < 160 chars
 *   2. Upsert dans ai_seo_content (idempotent sur (category_id, city_slug))
 *
 * Strategie anti-thin content :
 *   - Chaque prompt est unique (skill + ville → contexte different)
 *   - On force des chiffres reels (population ville INSEE + count Sirene Supabase)
 *   - On force des references locales (entreprises tech connues de la ville)
 *
 * Couts estime : sonnet-4-6 ~3000 tokens output / page x 2160 pages
 *               x $0.015 / 1k = ~$100 pour la totalite
 *               (lancer par batch de 100 pour validation progressive)
 *
 * Run :
 *   npx tsx scripts/generate-ai-seo-content.ts                  # dry-run 5 premieres
 *   npx tsx scripts/generate-ai-seo-content.ts --limit=100      # dry-run 100
 *   npx tsx scripts/generate-ai-seo-content.ts --limit=100 --apply
 *   npx tsx scripts/generate-ai-seo-content.ts --apply          # totalite (long, ~$100)
 *   npx tsx scripts/generate-ai-seo-content.ts --skill=react --apply # un skill seul
 *   npx tsx scripts/generate-ai-seo-content.ts --city=paris --apply  # une ville seule
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { TECH_CITIES } from "@/lib/data/tech-cities";

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key && key.length > 0) return key;
  try {
    const content = readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  } catch {}
  throw new Error("ANTHROPIC_API_KEY manquante");
}

const anthropic = new Anthropic({ apiKey: getApiKey() });
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CLI args
const APPLY = process.argv.includes("--apply");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const SKILL_ARG = process.argv.find((a) => a.startsWith("--skill="));
const CITY_ARG = process.argv.find((a) => a.startsWith("--city="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : 5;
const SKILL_FILTER = SKILL_ARG?.split("=")[1] || null;
const CITY_FILTER = CITY_ARG?.split("=")[1] || null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const CURRENT_YEAR = new Date().getFullYear();
const MONTH_NAMES = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
const CURRENT_MONTH = MONTH_NAMES[new Date().getMonth()];

type GeneratedContent = {
  intro_html: string;
  faq: Array<{ q: string; a: string }>;
  stats: {
    tjm_min: number;
    tjm_median: number;
    tjm_max: number;
    croissance_yoy_percent: number;
  };
  meta_title: string;
  meta_description: string;
};

type Category = {
  id: number;
  slug: string;
  name: string;
  parent_category_id: number | null;
  parent_name?: string;
};

async function generateContent(
  category: Category,
  citySlug: string | null,
  cityName: string | null,
  cityDeptName: string | null,
  cityPopulation: number | null,
  proCount: number
): Promise<GeneratedContent | null> {
  const isCity = citySlug !== null;
  const skillIsSubCategory = category.parent_category_id !== null;

  const prompt = `Tu es un redacteur SEO/GEO/AEO expert. Tu generes du contenu UNIQUE pour une page de listing freelance sur Workwave AI.

Contexte :
- Skill : ${category.name} ${skillIsSubCategory ? `(sous-categorie de ${category.parent_name})` : "(macro-categorie tech)"}
- Page : ${isCity ? `${cityName} (${cityDeptName})` : "France entiere"}
${isCity && cityPopulation ? `- Population ville : ${cityPopulation.toLocaleString("fr-FR")} habitants` : ""}
- Nombre de freelances dans cette categorie ${isCity ? "et ville" : "en France"} : ${proCount}
- Mois/Annee : ${CURRENT_MONTH} ${CURRENT_YEAR}

Retourne UNIQUEMENT un JSON valide (sans markdown, sans backticks) avec ces champs :

{
  "intro_html": "Intro HTML de 300-450 mots. UNIQUE pour cette ville+skill. Mentionne : (1) le contexte tech specifique de ${isCity ? cityName : "la France"}, (2) la demande pour ${category.name} dans le marche local, (3) les types de projets typiques, (4) ${isCity ? "1-2 entreprises tech connues de la ville (Bla Bla Car a Paris, Doctolib a Paris, ManoMano, Voodoo, Lydia, Backmarket, Mirakl, Veepee, Algolia, Withings, Datadog, Sonos, Spendesk, Aircall, Cabify, Mirakl, Carrefour Digital factory, etc.)" : "le contexte ecosysteme tech francais"}, (5) une mention sur les freelances Workwave AI qui repondent aux briefs en moins de 24h. Pas de listing de mots-cles. Style profession naturel, factuel. Utilise <p>, <strong>, pas de <h1/h2>.",
  "faq": [
    { "q": "Question 1 specifique au skill+ville", "a": "Reponse en 40-80 mots, avec une donnee chiffree ou un fait local" },
    { "q": "Quel est le TJM moyen d'un freelance ${category.name} a ${isCity ? cityName : "Paris"} en ${CURRENT_YEAR} ?", "a": "Reponse avec fourchette TJM mediane realiste pour ce skill + ville" },
    { "q": "Combien de temps pour trouver un freelance ${category.name} ${isCity ? `a ${cityName}` : ""} ?", "a": "Reponse mentionnant le matching IA Workwave en moins de 24h, et les 3 profils proposes" },
    { "q": "Question 4 specifique (ex. quels frameworks utiliser, quelles entreprises locales, etc.)", "a": "Reponse 40-80 mots" }
  ],
  "stats": {
    "tjm_min": entier en EUR, junior debutant (ex. 250-350),
    "tjm_median": entier en EUR, mid-level (ex. 450-650 selon skill),
    "tjm_max": entier en EUR, senior expert (ex. 800-1500 selon rarete),
    "croissance_yoy_percent": entier 0-30, croissance estimee de la demande sur 12 mois pour ce skill
  },
  "meta_title": "Pattern : 'Les 10 meilleurs freelances ${category.name} ${isCity ? `a ${cityName}` : "en France"} en ${CURRENT_MONTH} ${CURRENT_YEAR}' (max 70 chars). Si trop long, raccourcir intelligemment.",
  "meta_description": "Description SEO 140-160 chars, mentionne ${category.name}, ${isCity ? cityName : "France"}, freelances ${proCount > 0 ? proCount : ""}, matching IA <24h, gratuit sans credit."
}

Contraintes :
- TJM realistes pour le marche francais ${CURRENT_YEAR} (junior 250-400, mid 450-700, senior 700-1200, expert 1200+)
- Si skill IA / Cloud / Kubernetes : TJM mediane plus eleve (650-900)
- Si skill WordPress / Shopify / no-code : TJM mediane plus bas (350-550)
- Pas d'invention d'entreprises non reelles
- Pas de promesse de delai irrealiste`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned) as GeneratedContent;
  } catch (e) {
    console.error("    Claude error:", e);
    return null;
  }
}

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Workwave AI — Generation contenu SEO unique par page");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`Mode : ${APPLY ? "✓ APPLY" : "○ DRY-RUN"}`);
  console.log(`Limit : ${LIMIT}`);
  if (SKILL_FILTER) console.log(`Skill filter : ${SKILL_FILTER}`);
  if (CITY_FILTER) console.log(`City filter  : ${CITY_FILTER}`);
  console.log();

  // 1. Charge categories tech avec parent name
  const { data: cats } = await sb
    .from("categories")
    .select("id, slug, name, parent_category_id")
    .eq("vertical", "tech")
    .order("popularity", { ascending: false });

  if (!cats) {
    console.error("❌ Aucune categorie tech");
    process.exit(1);
  }

  // Map id → name pour resolve parent_name
  const nameById = new Map<number, string>();
  cats.forEach((c) => nameById.set(c.id, c.name));

  const catsWithParent: Category[] = cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    parent_category_id: c.parent_category_id,
    parent_name: c.parent_category_id ? nameById.get(c.parent_category_id) : undefined,
  }));

  // 2. Construit la liste des tuples (cat, city|null) a generer
  const tuples: Array<{ cat: Category; citySlug: string | null }> = [];

  for (const cat of catsWithParent) {
    if (SKILL_FILTER && cat.slug !== SKILL_FILTER) continue;
    // Page nationale du skill (city=null)
    if (!CITY_FILTER) {
      tuples.push({ cat, citySlug: null });
    }
    // Pages skill x ville
    for (const city of TECH_CITIES) {
      if (CITY_FILTER && city.slug !== CITY_FILTER) continue;
      tuples.push({ cat, citySlug: city.slug });
    }
  }

  console.log(`[init] ${tuples.length} tuples a evaluer`);

  // 3. Filtre ceux deja en base
  const { data: existingRows } = await sb
    .from("ai_seo_content")
    .select("category_id, city_slug");
  const existing = new Set(
    (existingRows || []).map((r) => `${r.category_id}|${r.city_slug || ""}`)
  );

  const toGenerate = tuples.filter(
    (t) => !existing.has(`${t.cat.id}|${t.citySlug || ""}`)
  );
  console.log(`[init] ${existing.size} deja generees, ${toGenerate.length} a generer`);

  // 4. Limit
  const slice = toGenerate.slice(0, LIMIT);
  console.log(`[init] Traitement : ${slice.length} pages\n`);

  let generated = 0;
  let saved = 0;
  let errors = 0;
  const start = Date.now();

  for (let i = 0; i < slice.length; i++) {
    const { cat, citySlug } = slice[i];
    const city = citySlug ? TECH_CITIES.find((c) => c.slug === citySlug) : null;

    // Count pros for this skill+city
    const filterCategoryId = cat.parent_category_id || cat.id;
    let query = sb
      .from("pros")
      .select("*", { count: "estimated", head: true })
      .eq("category_id", filterCategoryId)
      .eq("source", "sirene")
      .eq("is_active", true)
      .is("deleted_at", null);
    if (city) query = query.like("postal_code", `${city.dept_prefix}%`);
    const { count: proCount } = await query;

    process.stdout.write(
      `[${i + 1}/${slice.length}] ${cat.slug}${citySlug ? `/${citySlug}` : ""} (${proCount || 0} pros)... `
    );

    const content = await generateContent(
      cat,
      citySlug,
      city?.name || null,
      city?.dept_name || null,
      city?.population || null,
      proCount || 0
    );

    if (!content) {
      console.log("❌ generation failed");
      errors++;
      continue;
    }
    generated++;

    if (APPLY) {
      const { error } = await sb.from("ai_seo_content").upsert({
        category_id: cat.id,
        city_slug: citySlug,
        intro_html: content.intro_html,
        faq: content.faq,
        stats: content.stats,
        meta_title: content.meta_title,
        meta_description: content.meta_description,
        generated_at: new Date().toISOString(),
      }, { onConflict: "category_id,city_slug" });
      if (error) {
        console.log(`❌ insert error: ${error.message}`);
        errors++;
      } else {
        saved++;
        console.log("✓ saved");
      }
    } else {
      console.log(`✓ generated (${content.intro_html.length} chars intro)`);
    }

    // Rate limit Claude (40 req/min sonnet-4-6 = ~1.5s entre)
    await sleep(1500);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Generees : ${generated}`);
  console.log(`Sauvees  : ${APPLY ? saved : "(dry-run)"}`);
  console.log(`Erreurs  : ${errors}`);
  console.log(`Duree    : ${elapsed}s`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
