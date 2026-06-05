/**
 * Contexte marché freelance INTERNATIONAL sourcé via Perplexity (anglais).
 * Vague mondiale : Asie / Amérique latine / Océanie / Afrique.
 *
 * - Par VILLE  : paragraphe factuel (écosystème tech/freelance local).
 * - Par PAYS   : paragraphe factuel (marché freelance national).
 *
 * But : différencier chaque page /en/ai/* avec du contenu UNIQUE + SOURCÉ
 * (zéro chiffre inventé : tout vient de sources web citées).
 *
 * Sortie : lib/data/sourced-intl-market.ts (statique → ISR-safe).
 * Coût : ~100 requêtes Perplexity (sonar) ≈ $0.50.
 *
 * Usage : npx tsx scripts/fetch-sourced-intl-market.ts [--dry-run]
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
import { INTL_CITIES } from "../lib/data/intl-cities";
import { WORLD_COUNTRIES } from "../lib/data/intl-countries";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const KEY = process.env.PERPLEXITY_API_KEY;
const DRY = process.argv.includes("--dry-run");
if (!KEY) {
  console.error("❌ PERPLEXITY_API_KEY manquante");
  process.exit(1);
}

const NEW_REGIONS = ["Asia", "Latam", "Oceania", "Africa"];
const NEW_CONTINENTS = ["asia", "latin-america", "oceania", "africa"];

type Entry = { text: string; sources: string[]; retrievedAt: string };

function cityPrompt(city: string, country: string): string {
  const year = new Date().getFullYear();
  return (
    `Write a FACTUAL, SOURCED paragraph (3 to 4 sentences, ~70 words) in ENGLISH ` +
    `about the technology and freelance job market in ${city}, ${country}, in ${year}. ` +
    `Base it on recent web sources. Mention, where relevant: the local tech/digital ecosystem, ` +
    `notable industries or company presence, demand for software/design/marketing freelancers, ` +
    `and remote-work or outsourcing trends. ` +
    `RULES: stay factual, do NOT invent any unsourced figures, no marketing superlatives. ` +
    `Reply ONLY as valid JSON: {"text":"<the paragraph>"}`
  );
}

function countryPrompt(country: string): string {
  const year = new Date().getFullYear();
  return (
    `Write a FACTUAL, SOURCED paragraph (3 to 4 sentences, ~70 words) in ENGLISH ` +
    `about the freelance and remote-work market in ${country} in ${year}. ` +
    `Base it on recent web sources. Mention, where relevant: the national tech/digital talent pool, ` +
    `strengths (software, design, marketing, BPO, etc.), the growth of freelancing and remote work, ` +
    `and how international clients hire from the country. ` +
    `RULES: stay factual, do NOT invent any unsourced figures, no marketing superlatives. ` +
    `Reply ONLY as valid JSON: {"text":"<the paragraph>"}`
  );
}

async function fetchOne(label: string, prompt: string): Promise<{ entry: Entry | null; cost: number }> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const cost = data?.usage?.cost?.total_cost || 0;
  if (!res.ok || !data?.choices) {
    console.log(`  ✗ ${label}: API ${res.status}`);
    return { entry: null, cost };
  }
  const content: string = data.choices[0]?.message?.content || "";
  const citations: string[] =
    (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results) ? data.search_results.map((s: { url?: string }) => s.url).filter(Boolean) : []) ||
    [];
  const m = content.match(/\{[\s\S]*\}/);
  let text = "";
  if (m) {
    try {
      text = (JSON.parse(m[0]).text || "")
        .replace(/\[\d+\]/g, "")
        .replace(/ {2,}/g, " ")
        .trim();
    } catch {
      /* ignore */
    }
  }
  if (text.length < 60) {
    console.log(`  ✗ ${label}: texte trop court/parse KO`);
    return { entry: null, cost };
  }
  return {
    entry: { text, sources: citations.slice(0, 4), retrievedAt: new Date().toISOString().slice(0, 10) },
    cost,
  };
}

async function main() {
  const cities = INTL_CITIES.filter((c) => NEW_REGIONS.includes(c.region));
  const countries = WORLD_COUNTRIES.filter((c) => NEW_CONTINENTS.includes(c.continentSlug));
  console.log(
    `Marché intl sourcé — ${cities.length} villes + ${countries.length} pays${DRY ? " (DRY : 1+1)" : ""}\n`
  );

  const cityOut: Record<string, Entry> = {};
  const countryOut: Record<string, Entry> = {};
  let total = 0;

  const cityList = DRY ? cities.slice(0, 1) : cities;
  for (const c of cityList) {
    const { entry, cost } = await fetchOne(`${c.name}`, cityPrompt(c.name, c.country));
    total += cost;
    if (entry) {
      cityOut[c.slug] = entry;
      console.log(`  ✓ city ${c.name.padEnd(20)} ${entry.sources.length} src · ${entry.text.length} car.`);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  const countryList = DRY ? countries.slice(0, 1) : countries;
  for (const c of countryList) {
    const { entry, cost } = await fetchOne(`${c.name}`, countryPrompt(c.name));
    total += cost;
    if (entry) {
      countryOut[c.countryCode] = entry;
      console.log(`  ✓ country ${c.name.padEnd(18)} ${entry.sources.length} src · ${entry.text.length} car.`);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(
    `\nOK : ${Object.keys(cityOut).length} villes + ${Object.keys(countryOut).length} pays · coût ≈ $${total.toFixed(4)}`
  );
  if (DRY) {
    console.log("\nAperçu ville :\n", JSON.stringify(cityOut, null, 2));
    console.log("\nAperçu pays :\n", JSON.stringify(countryOut, null, 2));
    return;
  }
  const file =
    `// Contexte marché freelance international SOURCÉ (Perplexity, web + citations).\n` +
    `// Généré le ${new Date().toISOString().slice(0, 10)}. NE PAS éditer à la main :\n` +
    `// relancer \`npx tsx scripts/fetch-sourced-intl-market.ts\`. Zéro chiffre inventé.\n\n` +
    `export type IntlMarketEntry = { text: string; sources: string[]; retrievedAt: string };\n\n` +
    `// Keyed par slug de ville.\n` +
    `export const SOURCED_INTL_CITY: Record<string, IntlMarketEntry> = ${JSON.stringify(cityOut, null, 2)};\n\n` +
    `// Keyed par countryCode (ISO 3166-1 alpha-2).\n` +
    `export const SOURCED_INTL_COUNTRY: Record<string, IntlMarketEntry> = ${JSON.stringify(countryOut, null, 2)};\n`;
  fs.writeFileSync(path.resolve(process.cwd(), "lib/data/sourced-intl-market.ts"), file);
  console.log(`\n📝 Écrit lib/data/sourced-intl-market.ts`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
