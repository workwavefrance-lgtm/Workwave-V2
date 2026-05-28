/**
 * Genere des descriptions IA pour les fiches BTP thin content (qui n'ont
 * pas de description manuelle riche).
 *
 * Objectif : debloquer les 3 384 pages "Exploree non indexee" en GSC en
 * leur ajoutant du contenu enrichi pour passer le seuil thin content de
 * Google.
 *
 * Strategie :
 *   1. Selectionne les pros BTP avec :
 *      - is_active = true, deleted_at IS NULL
 *      - claimed_by_user_id IS NULL (les claimed ont deja leur description)
 *      - description NULL ou < 100 chars
 *      - description_ai NULL (pas deja genere)
 *   2. Pour chaque, Claude Haiku genere une description 200-400 chars
 *      avec : metier, ville, type d'intervention, ton pro factuel.
 *   3. Update pros.description_ai en BDD.
 *
 * Cout estime : ~$0.0008/page Claude Haiku × 5000 = ~$4 USD total.
 *
 * Usage :
 *   npx tsx scripts/_generate-ai-descriptions.ts --max=10       # test
 *   npx tsx scripts/_generate-ai-descriptions.ts --max=500      # batch
 *   npx tsx scripts/_generate-ai-descriptions.ts                # tout
 */
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const TRACKING_FILE = path.resolve(process.cwd(), "tracking/ai-descriptions.json");
const RATE_LIMIT_MS = 100; // limit Anthropic ~10 req/s sur Sonnet, plus haut sur Haiku

const MAX_LIMIT = (() => {
  const arg = process.argv.find((a) => a.startsWith("--max="));
  return arg ? parseInt(arg.slice(6), 10) : Infinity;
})();

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const AI_CATEGORY_IDS = [43, 44, 45, 46, 47, 48, 79, 80, 81, 82, 83, 85, 86, 87];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type Tracking = {
  startedAt: string;
  processed: Array<{
    proId: number;
    name: string;
    descriptionAi: string;
    at: string;
  }>;
};

function loadTracking(): Tracking {
  if (!fs.existsSync(path.dirname(TRACKING_FILE))) {
    fs.mkdirSync(path.dirname(TRACKING_FILE), { recursive: true });
  }
  if (!fs.existsSync(TRACKING_FILE)) {
    return { startedAt: new Date().toISOString(), processed: [] };
  }
  return JSON.parse(fs.readFileSync(TRACKING_FILE, "utf-8"));
}

function saveTracking(t: Tracking) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(t, null, 2));
}

type Pro = {
  id: number;
  name: string;
  category: { name: string; slug: string } | null;
  city: { name: string; postal_code: string | null } | null;
  founded_year: number | null;
  effectif_range: string | null;
  has_decennale: boolean | null;
  has_rc_pro: boolean | null;
  certifications: unknown;
};

function buildPrompt(pro: Pro): string {
  const facts: string[] = [];
  facts.push(`Nom : ${pro.name}`);
  if (pro.category?.name) facts.push(`Métier : ${pro.category.name}`);
  if (pro.city?.name) facts.push(`Ville : ${pro.city.name}${pro.city.postal_code ? ` (${pro.city.postal_code})` : ""}`);
  if (pro.founded_year) facts.push(`Année de création : ${pro.founded_year}`);
  if (pro.effectif_range) facts.push(`Effectif : ${pro.effectif_range}`);
  if (pro.has_decennale) facts.push("Garantie décennale : oui");
  if (pro.has_rc_pro) facts.push("RC Pro : oui");
  const certs = Array.isArray(pro.certifications) ? (pro.certifications as string[]) : [];
  if (certs.length > 0) facts.push(`Certifications : ${certs.join(", ")}`);

  return `Tu es rédacteur SEO pour Workwave, annuaire de professionnels de Nouvelle-Aquitaine.

Génère une description de 200 à 400 caractères pour une fiche professionnelle. La description doit :
- Présenter le pro avec son métier et sa ville
- Mentionner ses certifications et garanties SI elles sont fournies
- Ton factuel, professionnel, sans superlatifs creux ("excellent", "incontournable", "leader")
- Pas d'invention de services ou de spécialités non fournis
- Pas de slogan marketing, juste les faits
- Format : 2-3 phrases pleines

Faits sur le pro :
${facts.join("\n")}

Réponds UNIQUEMENT par la description, sans préambule ni guillemets.`;
}

async function generateDescription(pro: Pro): Promise<string | null> {
  try {
    const r = await ai.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      messages: [{ role: "user", content: buildPrompt(pro) }],
    });
    const block = r.content[0];
    if (block.type !== "text") return null;
    const text = block.text.trim();
    if (text.length < 50 || text.length > 600) return null;
    return text;
  } catch (e) {
    console.error("Claude erreur :", e instanceof Error ? e.message : e);
    return null;
  }
}

async function main() {
  console.log("=== Generate AI descriptions pour fiches BTP thin content ===\n");

  const tracking = loadTracking();
  const processedIds = new Set(tracking.processed.map((p) => p.proId));
  console.log(`Tracking : ${processedIds.size} pros deja traites`);

  // Charger les targets
  console.log("Chargement targets (BTP sans description riche ni AI desc)...");
  const PAGE = 500;
  let offset = 0;
  const targets: Pro[] = [];
  while (targets.length < MAX_LIMIT) {
    const { data } = await sb
      .from("pros")
      .select(
        "id, name, founded_year, effectif_range, has_decennale, has_rc_pro, certifications, description, description_ai, category:categories(name, slug), city:cities(name, postal_code)"
      )
      .eq("is_active", true)
      .is("deleted_at", null)
      .is("claimed_by_user_id", null)
      .is("description_ai", null)
      .not("category_id", "in", `(${AI_CATEGORY_IDS.join(",")})`)
      .range(offset, offset + PAGE - 1);
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows as unknown as Array<Pro & { description: string | null; description_ai: string | null }>) {
      if (processedIds.has(r.id)) continue;
      // Skip si description manuelle deja riche
      if (r.description && r.description.length >= 100) continue;
      const cat = Array.isArray(r.category) ? r.category[0] : r.category;
      const city = Array.isArray(r.city) ? r.city[0] : r.city;
      targets.push({ ...r, category: cat, city });
      if (targets.length >= MAX_LIMIT) break;
    }
    offset += rows.length;
  }
  console.log(`A traiter ce run : ${targets.length}\n`);
  if (targets.length === 0) {
    console.log("Aucun pro a enrichir. Tout est deja traite.");
    return;
  }

  // Genere et update
  let okCount = 0;
  let failCount = 0;
  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    const desc = await generateDescription(p);
    if (desc) {
      await sb.from("pros").update({ description_ai: desc }).eq("id", p.id);
      tracking.processed.push({
        proId: p.id,
        name: p.name,
        descriptionAi: desc,
        at: new Date().toISOString(),
      });
      okCount++;
    } else {
      failCount++;
    }
    if ((i + 1) % 10 === 0 || i + 1 === targets.length) {
      console.log(`  [${i + 1}/${targets.length}] OK=${okCount} FAIL=${failCount}`);
      saveTracking(tracking);
    }
    await sleep(RATE_LIMIT_MS);
  }
  saveTracking(tracking);

  console.log(`\n=== FIN ===`);
  console.log(`OK   : ${okCount}`);
  console.log(`FAIL : ${failCount}`);
  console.log(`Tracking : ${TRACKING_FILE}`);

  // Aperçu de 3 descriptions generees
  if (tracking.processed.length > 0) {
    console.log(`\nApercu de 3 descriptions generees :`);
    const sample = tracking.processed.slice(-3);
    for (const s of sample) {
      console.log(`\n  #${s.proId} (${s.name}) :`);
      console.log(`    "${s.descriptionAi}"`);
    }
  }
}

main().catch((e) => {
  console.error("Crash :", e instanceof Error ? e.message : e);
  process.exit(1);
});
