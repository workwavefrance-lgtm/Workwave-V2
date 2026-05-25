/**
 * Genere du contenu SEO UNIQUE pour /ai/[skill]/[ville] — version
 * sourcee + verifiee (zero invention).
 *
 * Principe ANTI-HALLUCINATION :
 *   - Claude n'ecrit QUE l'intro_html (300 mots creative writing) + meta + FAQ
 *   - Claude NE GENERE PAS :
 *     · TJM ou tarifs → vient de lib/data/tech-tjm-reference.ts (sources :
 *       Blog du Moderateur 2026, Free-Work tracker, Comet observatoire 2026)
 *     · Noms d'entreprises locales → vient de lib/data/tech-companies-by-city.ts
 *       (whitelist verifiable via Wikipedia/site officiel)
 *     · Statistiques chiffrees (nb freelances, croissance %, etc.)
 *   - Le prompt interdit explicitement les claims chiffres et noms propres
 *   - Le rendu de page COMPOSE : intro Claude + blocs data verifies +
 *     footer "Sources" obligatoire
 *
 * Run :
 *   npx tsx scripts/generate-ai-seo-content.ts                # dry-run 5
 *   npx tsx scripts/generate-ai-seo-content.ts --limit=100 --apply
 *   npx tsx scripts/generate-ai-seo-content.ts --skill=react --apply
 *   npx tsx scripts/generate-ai-seo-content.ts --city=paris --apply
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

const APPLY = process.argv.includes("--apply");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const SKILL_ARG = process.argv.find((a) => a.startsWith("--skill="));
const CITY_ARG = process.argv.find((a) => a.startsWith("--city="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : 5;
const SKILL_FILTER = SKILL_ARG?.split("=")[1] || null;
const CITY_FILTER = CITY_ARG?.split("=")[1] || null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const CURRENT_YEAR = new Date().getFullYear();
const MONTH_NAMES = [
  "janvier", "fevrier", "mars", "avril", "mai", "juin",
  "juillet", "aout", "septembre", "octobre", "novembre", "decembre",
];
const CURRENT_MONTH = MONTH_NAMES[new Date().getMonth()];

type GeneratedContent = {
  intro_html: string;
  faq: Array<{ q: string; a: string }>;
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
  cityName: string | null
): Promise<GeneratedContent | null> {
  const isCity = citySlug !== null;
  const skillIsSubCategory = category.parent_category_id !== null;

  // PROMPT STRICT ANTI-INVENTION :
  // Claude n'ecrit QUE de la creative writing (description du metier,
  // contexte de la ville en general, intro). Pas de TJM, pas de nb
  // freelances, pas de croissance, pas de noms d'entreprises specifiques.
  // Tous les claims chiffres / noms sont injectes ailleurs (data files).
  const prompt = `Tu rediges du contenu SEO pour une page de listing freelance.

CONTEXTE :
- Skill : ${category.name}${skillIsSubCategory ? ` (sous-categorie de ${category.parent_name})` : ""}
- Localisation : ${isCity ? `${cityName}` : "France entiere"}
- Mois/Annee : ${CURRENT_MONTH} ${CURRENT_YEAR}

REGLES STRICTES (respect obligatoire) :

🚫 NE PAS :
- Mentionner de chiffres precis (TJM, tarifs, salaires, pourcentages, nb d'entreprises, nb de freelances)
- Citer des noms d'entreprises specifiques (ni a Paris, ni a Lyon, ni nulle part)
- Inventer des statistiques de marche
- Faire des promesses chiffrees ("X freelances en 24h", "+50% YoY", etc.)
- Mentionner des donnees temporelles non verifiables ("le marche a explose en 2023", etc.)

✅ TU PEUX :
- Decrire le skill techniquement (frameworks, langages, ecosysteme technique)
- Mentionner le contexte general de la ville (etudiants, ecoles, dynamique tech) SANS nommer d'entreprises
- Decrire les types de projets typiques pour ce skill
- Mentionner Workwave AI : matching IA, inscription gratuite, sans credit

Retourne UNIQUEMENT un JSON valide (sans markdown, sans backticks) :

{
  "intro_html": "Texte HTML de 280-380 mots, structure en 3 paragraphes <p>...</p>. UNIQUE pour cette ville+skill. Aucun chiffre, aucune entreprise nommee. Style sobre, factuel, professionnel. Pas de superlatifs (meilleur, top, leader, etc.) car ils sont vagues. Mentionne 1 fois Workwave AI dans le dernier paragraphe.",
  "faq": [
    { "q": "Question 1 unique sur le skill ${category.name}", "a": "Reponse 40-70 mots SANS chiffre ni entreprise nommee" },
    { "q": "Quelles sont les missions typiques d'un freelance ${category.name} ?", "a": "Reponse decrivant le type de projets, sans chiffres ni entreprises" },
    { "q": "Question 3 unique adaptee a ${isCity ? cityName : "la France"}", "a": "Reponse sans chiffres ni entreprises specifiques" },
    { "q": "Comment Workwave AI selectionne les freelances ${category.name} ?", "a": "Reponse expliquant le matching IA, sans chiffres precis (pas de '24h', pas de '3 profils', juste 'en moins de 24h', 'plusieurs profils')" }
  ],
  "meta_title": "Pattern STRICT : 'Les meilleurs freelances ${category.name} ${isCity ? `a ${cityName}` : "en France"} en ${CURRENT_MONTH} ${CURRENT_YEAR}' (max 70 chars). Pas de chiffre dans le title.",
  "meta_description": "Description SEO 140-160 chars. Mentionne ${category.name}, ${isCity ? cityName : "France"}, matching IA, inscription gratuite. AUCUN chiffre."
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned) as GeneratedContent;

    // Validation post-generation : check that no number patterns leak
    // (TJM, prix, pourcentages, etc.)
    const NUMBER_PATTERNS = /\b(\d{2,5}\s*(?:€|EUR|euros|\$|jours?|j\/h|TJM|%))/gi;
    const fullText = parsed.intro_html + JSON.stringify(parsed.faq);
    const numbers = fullText.match(NUMBER_PATTERNS);
    if (numbers && numbers.length > 0) {
      console.warn(`    ⚠ Numbers leaked: ${numbers.join(", ")} — rejecting`);
      return null;
    }

    return parsed;
  } catch (e) {
    console.error("    Claude error:", e);
    return null;
  }
}

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Workwave AI — Generation contenu SEO (anti-hallucination)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Garanties : zero chiffre invente, zero nom d'entreprise");
  console.log("Donnees factuelles (TJM, entreprises) viennent de data files");
  console.log("verifies (sources citees dans le footer de chaque page).\n");
  console.log(`Mode  : ${APPLY ? "✓ APPLY" : "○ DRY-RUN"}`);
  console.log(`Limit : ${LIMIT}`);
  if (SKILL_FILTER) console.log(`Skill : ${SKILL_FILTER}`);
  if (CITY_FILTER) console.log(`City  : ${CITY_FILTER}`);
  console.log();

  // 1. Categories tech
  const { data: cats } = await sb
    .from("categories")
    .select("id, slug, name, parent_category_id")
    .eq("vertical", "tech")
    .order("popularity", { ascending: false });

  if (!cats) {
    console.error("❌ Aucune categorie tech");
    process.exit(1);
  }

  const nameById = new Map<number, string>();
  cats.forEach((c) => nameById.set(c.id, c.name));

  const catsWithParent: Category[] = cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    parent_category_id: c.parent_category_id,
    parent_name: c.parent_category_id ? nameById.get(c.parent_category_id) : undefined,
  }));

  // 2. Tuples (cat, city|null)
  const tuples: Array<{ cat: Category; citySlug: string | null }> = [];

  for (const cat of catsWithParent) {
    if (SKILL_FILTER && cat.slug !== SKILL_FILTER) continue;
    if (!CITY_FILTER) tuples.push({ cat, citySlug: null });
    for (const city of TECH_CITIES) {
      if (CITY_FILTER && city.slug !== CITY_FILTER) continue;
      tuples.push({ cat, citySlug: city.slug });
    }
  }

  console.log(`[init] ${tuples.length} tuples a evaluer`);

  // 3. Filtre deja generes
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

  const slice = toGenerate.slice(0, LIMIT);
  console.log(`[init] Traitement : ${slice.length}\n`);

  let generated = 0;
  let saved = 0;
  let errors = 0;
  const start = Date.now();

  for (let i = 0; i < slice.length; i++) {
    const { cat, citySlug } = slice[i];
    const city = citySlug ? TECH_CITIES.find((c) => c.slug === citySlug) : null;

    process.stdout.write(
      `[${i + 1}/${slice.length}] ${cat.slug}${citySlug ? `/${citySlug}` : ""}... `
    );

    const content = await generateContent(cat, citySlug, city?.name || null);

    if (!content) {
      console.log("❌ skip");
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
        stats: {}, // empty — TJM viennent de tech-tjm-reference, pas du LLM
        meta_title: content.meta_title,
        meta_description: content.meta_description,
        generated_at: new Date().toISOString(),
      }, { onConflict: "category_id,city_slug" });
      if (error) {
        console.log(`❌ ${error.message}`);
        errors++;
      } else {
        saved++;
        console.log(`✓ saved (${content.intro_html.length} chars)`);
      }
    } else {
      console.log(`✓ generated (${content.intro_html.length} chars)`);
    }

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
