/**
 * Phase 1a — Tarifs freelance par PAYS, SOURCÉS (Perplexity sonar), pour les
 * hubs pricing skill×pays de workwaveai.co (/en/ai/[skill]/country/[country]).
 *
 * On source UNE fourchette de référence par pays (day rate USD d'un freelance
 * SENIOR tech/digital) + un niveau de marché. C'est l'ANCRE géographique qui
 * manquait : on combinera ensuite avec la fourchette par skill pour afficher un
 * prix indicatif crédible PAR pays (un senior à Bangalore ≠ à Zurich).
 *
 * ⚠️ ZÉRO chiffre inventé : si Perplexity ne peut pas sourcer, on garde null.
 * ⚠️ 100 % AI/tech — ne touche RIEN du BTP.
 *
 * Sortie : lib/data/ai-country-rates.ts (keyé par slug = slugifyCountry(name),
 * cohérent avec lib/data/intl-countries.ts). Coût : ~58 requêtes ≈ $0.35.
 *
 * Usage : npx tsx scripts/fetch-ai-country-rates.ts [--dry-run]
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
const DRY = process.argv.includes("--dry-run");
const year = new Date().getFullYear();

// slug pays IDENTIQUE à lib/data/intl-countries.ts slugifyCountry().
function slugifyCountry(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Pays présents dans INTL_CITIES (USA inclus ici pour complétude — utile au hub
// national/états ; les autres alimentent /en/ai/[skill]/country/[country]).
const COUNTRIES = [
  "United States", "India", "Japan", "China", "United Arab Emirates", "Saudi Arabia",
  "Mexico", "Indonesia", "Brazil", "Australia", "Vietnam", "Thailand", "Switzerland",
  "Spain", "South Korea", "South Africa", "Philippines", "Pakistan", "New Zealand",
  "Malaysia", "Germany", "Colombia", "Argentina", "Uruguay", "United Kingdom",
  "Tunisia", "Taiwan", "Sweden", "Sri Lanka", "Singapore", "Senegal", "Rwanda",
  "Qatar", "Portugal", "Poland", "Peru", "Oman", "Nigeria", "Netherlands", "Morocco",
  "Monaco", "Kuwait", "Kenya", "Italy", "Israel", "Ireland", "Hong Kong", "Ghana",
  "France", "Estonia", "Egypt", "Denmark", "Chile", "Cambodia", "Belgium",
  "Bangladesh", "Bahrain", "Austria",
];

type Entry = {
  slug: string;
  name: string;
  seniorHourlyMinUsd: number | null;
  seniorHourlyMaxUsd: number | null;
  level: string | null; // budget | mid | high | premium
  note: string;
  sources: string[];
  retrievedAt: string;
};

function buildPrompt(country: string): string {
  return (
    `In ${year}, what is a realistic freelance HOURLY RATE in USD PER HOUR for an experienced/SENIOR ` +
    `software or digital freelancer (developer, designer, marketer) based in ${country}? ` +
    `Use the standard international metric: USD per HOUR (as published on Upwork/Toptal rate data, ` +
    `freelance market reports, developer rate surveys). NOT a daily rate — an HOURLY rate. ` +
    `Answer ONLY in strict JSON: {"seniorHourlyMinUsd": <number or null>, "seniorHourlyMaxUsd": <number or null>, ` +
    `"level": "budget|mid|high|premium", "note": "<one factual sentence on the local freelance HOURLY rate level vs the global market>"}. ` +
    `Realistic sanity check: senior rates range roughly $15-40/h in low-cost markets, $40-90/h in mid markets, ` +
    `$90-200/h in premium markets. If you cannot source a realistic figure, set the two numbers to null. DO NOT invent.`
  );
}

async function fetchOne(country: string): Promise<Entry> {
  const slug = slugifyCountry(country);
  const base: Entry = {
    slug, name: country, seniorHourlyMinUsd: null, seniorHourlyMaxUsd: null,
    level: null, note: "", sources: [], retrievedAt: new Date().toISOString().slice(0, 10),
  };
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sonar", temperature: 0.2, messages: [{ role: "user", content: buildPrompt(country) }] }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  if (!res.ok || !data?.choices) return base;
  const content: string = data.choices[0]?.message?.content || "";
  base.sources = (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results) ? data.search_results.map((s: { url?: string }) => s.url).filter(Boolean) : []) || [];
  const m = content.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const j = JSON.parse(m[0].replace(/\[\d+\]/g, ""));
      base.seniorHourlyMinUsd = typeof j.seniorHourlyMinUsd === "number" ? j.seniorHourlyMinUsd : null;
      base.seniorHourlyMaxUsd = typeof j.seniorHourlyMaxUsd === "number" ? j.seniorHourlyMaxUsd : null;
      base.level = j.level || null;
      base.note = (j.note || "").replace(/\[\d+\]/g, "").trim();
    } catch { /* ignore */ }
  }
  base.sources = base.sources.slice(0, 4);
  return base;
}

async function main() {
  console.log(`Tarifs freelance par pays — ${COUNTRIES.length} pays (Perplexity)${DRY ? " [DRY: 3 pays]" : ""}\n`);
  const list = DRY ? COUNTRIES.slice(0, 3) : COUNTRIES;
  const out: Record<string, Entry> = {};
  for (const c of list) {
    const e = await fetchOne(c);
    out[e.slug] = e;
    const rate = e.seniorHourlyMinUsd ? `$${e.seniorHourlyMinUsd}-${e.seniorHourlyMaxUsd}/h` : "non sourcé";
    console.log(`  ${e.slug.padEnd(22)} ${(e.level || "?").padEnd(8)} ${rate.padEnd(18)} ${e.sources.length} src`);
    await new Promise((r) => setTimeout(r, 1100));
  }
  const sourced = Object.values(out).filter((e) => e.seniorHourlyMinUsd !== null).length;
  console.log(`\nSourcés avec tarif : ${sourced}/${list.length}`);
  if (DRY) { console.log("\n[DRY] aperçu:\n", JSON.stringify(out, null, 1)); return; }
  const header = `// Tarifs freelance SENIOR par pays (USD/heure), SOURCÉS Perplexity le ${new Date().toISOString().slice(0,10)}.\n// Ancre géographique pour les hubs pricing skill×pays (/en/ai/[skill]/country/[country]).\n// NE PAS éditer à la main : relancer scripts/fetch-ai-country-rates.ts. Zéro chiffre inventé.\n\nexport type AiCountryRate = { slug: string; name: string; seniorHourlyMinUsd: number | null; seniorHourlyMaxUsd: number | null; level: string | null; note: string; sources: string[]; retrievedAt: string };\n\nexport const AI_COUNTRY_RATES: Record<string, AiCountryRate> = ${JSON.stringify(out, null, 2)};\n\nexport function getAiCountryRate(slug: string): AiCountryRate | null {\n  return AI_COUNTRY_RATES[slug] || null;\n}\n`;
  fs.writeFileSync(path.resolve(process.cwd(), "lib/data/ai-country-rates.ts"), header);
  console.log("✓ écrit → lib/data/ai-country-rates.ts");
}

main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
