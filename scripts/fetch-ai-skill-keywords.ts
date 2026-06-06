/**
 * Extraction SOURCÉE (Perplexity sonar) de la demande + des mots-clés longue
 * traîne pour les SERVICES IA candidats de workwaveai.co (/en/ai/{slug}).
 *
 * But : finaliser le plan de silos IA (vs Fiverr) avec des données RÉELLES —
 * jamais de volume inventé. Perplexity s'appuie sur le web (catégories
 * Upwork/Fiverr, offres d'emploi, articles de tendance) ; si un volume précis
 * n'est pas sourçable, on garde "not publicly available".
 *
 * ⚠️ 100 % côté AI/tech — ce script ne touche RIEN du BTP.
 *
 * Sortie : data/competitive/ai-skill-keywords.json (gitignoré) + récap console.
 * Coût : ~22 requêtes sonar ≈ $0.15.
 *
 * Usage : npx tsx scripts/fetch-ai-skill-keywords.ts
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const KEY = process.env.PERPLEXITY_API_KEY;
if (!KEY) {
  console.error("❌ PERPLEXITY_API_KEY manquante");
  process.exit(1);
}
const year = new Date().getFullYear();

// Services IA candidats (seed keyword + slug cible /en/ai/{slug}).
const CANDIDATES: { slug: string; kw: string }[] = [
  { slug: "ai-chatbot-development", kw: "ai chatbot development" },
  { slug: "hire-ai-developer", kw: "hire ai developer" },
  { slug: "ai-app-development", kw: "ai app development services" },
  { slug: "ai-logo-design", kw: "ai logo design" },
  { slug: "ai-content-writing", kw: "ai content writing services" },
  { slug: "prompt-engineering", kw: "prompt engineering services" },
  { slug: "ai-voice-over", kw: "ai voice over" },
  { slug: "ai-video-editing", kw: "ai video editing" },
  { slug: "generative-ai-art", kw: "ai image generation services" },
  { slug: "ai-automation", kw: "ai automation services" },
  { slug: "ai-seo", kw: "ai seo services" },
  { slug: "ai-website-development", kw: "ai website development" },
  { slug: "ai-data-annotation", kw: "ai data annotation services" },
  { slug: "machine-learning-development", kw: "machine learning development services" },
  { slug: "computer-vision-development", kw: "computer vision development services" },
  { slug: "nlp-development", kw: "natural language processing services" },
  { slug: "ai-consulting", kw: "ai consulting services" },
  { slug: "llm-development", kw: "llm development services" },
  { slug: "ai-integration", kw: "ai integration services" },
  { slug: "ai-fine-tuning", kw: "ai model fine tuning services" },
  { slug: "rag-development", kw: "rag development services" },
  { slug: "ai-music-generation", kw: "ai music generation services" },
];

type Row = {
  slug: string;
  kw: string;
  real_demand?: string;
  volume_note?: string;
  difficulty?: string;
  variants?: string[];
  recommend?: string;
  reason?: string;
  sources: string[];
};

function buildPrompt(kw: string): string {
  return (
    `You are an SEO & freelance-market analyst. For the freelance/agency service keyword "${kw}" ` +
    `(target market: United States + global, year ${year}), answer ONLY with strict JSON:\n` +
    `{"real_demand":"high|medium|low|niche","volume_note":"<approx monthly US search volume ONLY if you can cite a real source; otherwise \\"not publicly available\\". NEVER invent a number.>",` +
    `"difficulty":"low|medium|high","variants":["<6 to 8 real long-tail keywords people actually search around this service>"],` +
    `"recommend":"yes|no","reason":"<one short sentence on whether a dedicated category page is worth it>"}\n` +
    `Base demand & difficulty on web evidence (Upwork/Fiverr category presence, job postings, 2025-2026 trend articles). Do not invent search volumes.`
  );
}

async function fetchOne(c: { slug: string; kw: string }): Promise<Row> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      temperature: 0.2,
      messages: [{ role: "user", content: buildPrompt(c.kw) }],
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const row: Row = { slug: c.slug, kw: c.kw, sources: [] };
  if (!res.ok || !data?.choices) return row;
  const content: string = data.choices[0]?.message?.content || "";
  row.sources =
    (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results)
      ? data.search_results.map((s: { url?: string }) => s.url).filter(Boolean)
      : []) ||
    [];
  const m = content.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const j = JSON.parse(m[0].replace(/\[\d+\]/g, ""));
      Object.assign(row, {
        real_demand: j.real_demand,
        volume_note: j.volume_note,
        difficulty: j.difficulty,
        variants: Array.isArray(j.variants) ? j.variants : [],
        recommend: j.recommend,
        reason: j.reason,
      });
    } catch {
      /* ignore parse */
    }
  }
  return row;
}

async function main() {
  console.log(`Extraction mots-clés IA — ${CANDIDATES.length} services (Perplexity sonar)\n`);
  const out: Row[] = [];
  let cost = 0;
  for (const c of CANDIDATES) {
    const row = await fetchOne(c);
    out.push(row);
    const ok = row.recommend ? "✓" : "·";
    console.log(
      `  ${ok} ${c.slug.padEnd(28)} demand=${(row.real_demand || "?").padEnd(7)} diff=${(row.difficulty || "?").padEnd(7)} reco=${row.recommend || "?"} | vol: ${(row.volume_note || "?").slice(0, 40)}`
    );
    await new Promise((r) => setTimeout(r, 1200));
  }
  const dir = path.resolve(process.cwd(), "data/competitive");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "ai-skill-keywords.json"), JSON.stringify(out, null, 2));
  console.log(`\n✓ ${out.length} services écrits → data/competitive/ai-skill-keywords.json`);
  const reco = out.filter((r) => r.recommend === "yes").length;
  console.log(`  Recommandés (recommend=yes) : ${reco}/${out.length}`);
}

main().catch((e) => {
  console.error("ERREUR:", e.message);
  process.exit(1);
});
