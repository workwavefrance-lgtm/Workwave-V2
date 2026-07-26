/**
 * Génère lib/data/metier-content.ts : contenu éditorial FACTUEL et SOURCÉ par
 * métier (Perplexity sonar, recherche web + citations) pour rendre les 52 pages
 * racine /[metier] réellement uniques et profondes.
 *
 * Respecte « zéro chiffre / zéro label inventé » : tout vient de sources web
 * réelles, citées. Additif (merge) : ne re-génère que les métiers manquants
 * sauf --force. Sortie statique → ISR-safe.
 *
 * Usage : npx tsx scripts/fetch-metier-content.ts [--dry-run] [--force] [--only=slug1,slug2]
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

const KEY = process.env.PERPLEXITY_API_KEY;
const DRY = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").replace("--only=", "");
if (!KEY) {
  console.error("❌ PERPLEXITY_API_KEY manquante dans .env.local");
  process.exit(1);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Faq = { q: string; a: string };
type Entry = {
  intro: string;
  certifications: string[];
  choisir: string[];
  facteursPrix: string[];
  faq: Faq[];
  sources: string[];
  retrievedAt: string;
};

function buildPrompt(name: string): string {
  const year = new Date().getFullYear();
  return (
    `Tu es un expert du métier de "${name}" en France. En te basant sur des sources web fiables et récentes (${year}), ` +
    `rédige un contenu FACTUEL et SPÉCIFIQUE à ce métier (jamais des généralités interchangeables).\n\n` +
    `Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant/après) au format EXACT :\n` +
    `{\n` +
    `  "intro": "3 à 4 phrases factuelles : ce que fait concrètement un ${name}, les interventions les plus courantes, et dans quels cas un particulier fait appel à lui. Spécifique et concret, pas de marketing.",\n` +
    `  "certifications": ["labels, certifications ou qualifications RÉELS et VÉRIFIABLES pertinents pour CE métier en France (ex. RGE, Qualibat, Qualifelec, Qualigaz, QualiPAC selon le métier). Tableau VIDE [] si aucune certification spécifique n'existe. N'INVENTE AUCUN label."],\n` +
    `  "choisir": ["4 à 5 conseils concrets et actionnables pour bien choisir un ${name} (points de vigilance propres à ce métier, assurance/garantie à vérifier si pertinent, questions à poser)."],\n` +
    `  "facteursPrix": ["3 à 4 facteurs concrets qui font varier le prix d'une prestation de ${name}."],\n` +
    `  "faq": [{"q": "question fréquente et spécifique à ce métier", "a": "réponse factuelle et courte"}]\n` +
    `}\n` +
    `La FAQ doit contenir 3 à 4 questions. RÈGLES IMPÉRATIVES : factuel, spécifique au métier, ZÉRO invention ` +
    `(surtout les certifications : uniquement des labels réellement existants), pas de blabla marketing, ` +
    `ne mentionne JAMAIS "Workwave" ni aucune plateforme.`
  );
}

// Nettoie le markdown que Perplexity glisse parfois (gras **, italique *, backticks, puces)
function stripMd(s: string): string {
  return String(s)
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^\s*[-*]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function asStrArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => stripMd(String(x))).filter((s) => s.length > 1).slice(0, 6);
}

async function fetchCat(name: string): Promise<{ entry: Entry | null; cost: number }> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      temperature: 0.2,
      messages: [{ role: "user", content: buildPrompt(name) }],
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const cost = data?.usage?.cost?.total_cost || 0;
  if (!res.ok || !data?.choices) {
    console.log(`  ✗ ${name}: API ${res.status} ${JSON.stringify(data).slice(0, 100)}`);
    return { entry: null, cost };
  }
  const content: string = data.choices[0]?.message?.content || "";
  const citations: string[] =
    (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results)
      ? data.search_results.map((s: { url?: string }) => s.url).filter(Boolean)
      : []) ||
    [];
  const m = content.replace(/\[\d+\]/g, "").match(/\{[\s\S]*\}/);
  if (!m) return { entry: null, cost };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(m[0]);
  } catch {
    console.log(`  ✗ ${name}: JSON invalide`);
    return { entry: null, cost };
  }
  const intro = stripMd(String(parsed.intro || ""));
  const faqRaw = Array.isArray(parsed.faq) ? parsed.faq : [];
  const faq: Faq[] = faqRaw
    .map((f: { q?: string; a?: string }) => ({ q: stripMd(String(f?.q || "")), a: stripMd(String(f?.a || "")) }))
    .filter((f: Faq) => f.q.length > 3 && f.a.length > 3)
    .slice(0, 4);
  if (intro.length < 30) {
    console.log(`  ✗ ${name}: intro trop courte`);
    return { entry: null, cost };
  }
  return {
    entry: {
      intro,
      certifications: asStrArr(parsed.certifications),
      choisir: asStrArr(parsed.choisir),
      facteursPrix: asStrArr(parsed.facteursPrix),
      faq,
      sources: citations.slice(0, 4),
      retrievedAt: new Date().toISOString().slice(0, 10),
    },
    cost,
  };
}

function loadExisting(): Record<string, Entry> {
  const dest = path.resolve(process.cwd(), "lib/data/metier-content.ts");
  if (!fs.existsSync(dest)) return {};
  const src = fs.readFileSync(dest, "utf8");
  const m = src.match(/METIER_CONTENT[^=]*=\s*(\{[\s\S]*\});/);
  if (!m) return {};
  try {
    return JSON.parse(m[1]) as Record<string, Entry>;
  } catch {
    return {};
  }
}

async function main() {
  const { data: cats, error } = await sb
    .from("categories")
    .select("slug,name")
    .in("vertical", ["btp", "domicile", "personne"])
    .order("slug");
  if (error || !cats) throw error;

  let list = cats;
  if (ONLY) {
    const set = new Set(ONLY.split(","));
    list = cats.filter((c) => set.has(c.slug));
  }

  const existing = loadExisting();
  const todo = list.filter((c) => FORCE || !existing[c.slug]);
  console.log(
    `Contenu métier Perplexity — ${Object.keys(existing).length} déjà en base, ${todo.length} à générer${DRY ? " (DRY, 2 max)" : ""}\n`
  );

  const fetched: Record<string, Entry> = {};
  let total = 0;
  const entries = DRY ? todo.slice(0, 2) : todo;
  for (const c of entries) {
    const { entry, cost } = await fetchCat(c.name);
    total += cost;
    if (entry) {
      fetched[c.slug] = entry;
      console.log(
        `  ✓ ${c.slug.padEnd(28)} intro ${entry.intro.length}c · ${entry.certifications.length} cert · ${entry.choisir.length} conseils · ${entry.faq.length} faq · ${entry.sources.length} src`
      );
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\nOK : ${Object.keys(fetched).length}/${entries.length} · coût ≈ $${total.toFixed(4)}`);
  if (DRY) {
    console.log("\nDRY — aperçu :\n", JSON.stringify(fetched, null, 2));
    return;
  }
  const out: Record<string, Entry> = { ...existing, ...fetched };
  const file =
    `// Contenu éditorial SOURCÉ par métier (Perplexity sonar, recherche web + citations).\n` +
    `// Généré le ${new Date().toISOString().slice(0, 10)} — NE PAS éditer à la main.\n` +
    `// « zéro invention » : intro/certifs/conseils issus de sources web réelles, citées.\n\n` +
    `export type MetierFaq = { q: string; a: string };\n` +
    `export type MetierContentEntry = {\n` +
    `  intro: string;\n  certifications: string[];\n  choisir: string[];\n` +
    `  facteursPrix: string[];\n  faq: MetierFaq[];\n  sources: string[];\n  retrievedAt: string;\n};\n\n` +
    `export const METIER_CONTENT: Record<string, MetierContentEntry> = ${JSON.stringify(out, null, 2)};\n`;
  const dest = path.resolve(process.cwd(), "lib/data/metier-content.ts");
  fs.writeFileSync(dest, file);
  console.log(`\n📝 Écrit ${dest} (${Object.keys(out).length} métiers)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
