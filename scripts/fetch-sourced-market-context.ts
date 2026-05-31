/**
 * Contexte "marché local BTP/artisanat" SOURCÉ via Perplexity, PAR DÉPARTEMENT
 * (28 nouveaux dépts : Bretagne, Pays de la Loire, Occitanie, PACA).
 *
 * But : injecter une section unique + sourcée sur chaque page dépt programmatique
 * (cf. lib/seo/seo-sections.ts), SANS toucher aux prix sourcés ni à l'OfferCatalog.
 * Zéro chiffre inventé : tout vient de sources web citées.
 *
 * Sortie : lib/data/sourced-market-context.ts (statique → ISR-safe).
 * Coût : 28 requêtes Perplexity (sonar) ≈ $0.15.
 *
 * Usage : npx tsx scripts/fetch-sourced-market-context.ts [--dry-run]
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const KEY = process.env.PERPLEXITY_API_KEY;
const DRY = process.argv.includes("--dry-run");
if (!KEY) {
  console.error("❌ PERPLEXITY_API_KEY manquante");
  process.exit(1);
}
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NEW_DEPT_CODES = [
  "22", "29", "35", "56", // Bretagne
  "44", "49", "53", "72", "85", // Pays de la Loire
  "09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82", // Occitanie
  "04", "05", "06", "13", "83", "84", // PACA
];

type Entry = { text: string; sources: string[]; retrievedAt: string };

function buildPrompt(deptName: string, code: string, region: string): string {
  const year = new Date().getFullYear();
  return (
    `En France, en ${year}, rédige un paragraphe FACTUEL et SOURCÉ (3 à 4 phrases, ~70 mots) ` +
    `sur le marché du bâtiment, de la rénovation et de l'artisanat dans le département ${deptName} (${code}), région ${region}. ` +
    `Appuie-toi sur des sources web récentes et mentionne, si pertinent : la dynamique de la construction/rénovation, ` +
    `les spécificités locales (type de bâti, patrimoine, climat), les principales villes, et les enjeux (rénovation énergétique, etc.). ` +
    `RÈGLES : reste factuel, n'invente AUCUN chiffre non sourcé, pas de superlatif marketing. ` +
    `Réponds UNIQUEMENT en JSON valide : {"text":"<le paragraphe>"}`
  );
}

async function fetchDept(deptName: string, code: string, region: string): Promise<{ entry: Entry | null; cost: number }> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      temperature: 0.2,
      messages: [{ role: "user", content: buildPrompt(deptName, code, region) }],
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const cost = data?.usage?.cost?.total_cost || 0;
  if (!res.ok || !data?.choices) {
    console.log(`  ✗ ${code} ${deptName}: API ${res.status}`);
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
        .replace(/\[\d+\]/g, "") // retire les marqueurs de citation Perplexity [1][2]
        .replace(/ {2,}/g, " ")
        .trim();
    } catch {
      /* ignore */
    }
  }
  if (text.length < 60) {
    console.log(`  ✗ ${code} ${deptName}: texte trop court/parse KO`);
    return { entry: null, cost };
  }
  return {
    entry: { text, sources: citations.slice(0, 4), retrievedAt: new Date().toISOString().slice(0, 10) },
    cost,
  };
}

async function main() {
  const { data: deptsRaw } = await sb
    .from("departments")
    .select("code, name, region")
    .in("code", NEW_DEPT_CODES);
  const depts = (deptsRaw || []) as Array<{ code: string; name: string; region: string }>;
  console.log(`Contexte marché sourcé — ${depts.length} dépts${DRY ? " (DRY, 1 dépt)" : ""}\n`);

  const out: Record<string, Entry> = {};
  let total = 0;
  const list = DRY ? depts.slice(0, 1) : depts;
  for (const d of list) {
    const { entry, cost } = await fetchDept(d.name, d.code, d.region);
    total += cost;
    if (entry) {
      out[d.code] = entry;
      console.log(`  ✓ ${d.code} ${d.name.padEnd(26)} ${entry.sources.length} sources · ${entry.text.length} car.`);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\nOK : ${Object.keys(out).length}/${list.length} · coût ≈ $${total.toFixed(4)}`);
  if (DRY) {
    console.log("\nAperçu :\n", JSON.stringify(out, null, 2));
    return;
  }
  const file =
    `// Contexte marché BTP/artisanat SOURCÉ par département (Perplexity, web + citations).\n` +
    `// Généré le ${new Date().toISOString().slice(0, 10)}. NE PAS éditer à la main :\n` +
    `// relancer \`npx tsx scripts/fetch-sourced-market-context.ts\`. Zéro chiffre inventé.\n\n` +
    `export type MarketContext = { text: string; sources: string[]; retrievedAt: string };\n\n` +
    `// Clé = code département (ex. "31" pour Haute-Garonne).\n` +
    `export const SOURCED_MARKET_CONTEXT: Record<string, MarketContext> = ${JSON.stringify(out, null, 2)};\n`;
  fs.writeFileSync(path.resolve(process.cwd(), "lib/data/sourced-market-context.ts"), file);
  console.log(`\n📝 Écrit lib/data/sourced-market-context.ts`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
