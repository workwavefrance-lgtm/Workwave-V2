/**
 * Paragraphe "marché du bâtiment à Monaco" SOURCÉ via Perplexity (cité, factuel).
 *
 * Les pages /[metier]/monaco montraient par défaut le contexte marché des
 * Alpes-Maritimes (06). Ce script génère un paragraphe SPÉCIFIQUE à Monaco
 * (marché haut de gamme, foncier rare sur ~2 km², artisans qui interviennent
 * depuis la Riviera frontalière). Zéro chiffre inventé : tout vient de sources
 * web citées (marqueurs [N] retirés).
 *
 * Sortie : à coller sous la clé "monaco" dans lib/data/sourced-market-context.ts.
 * Usage : npx tsx scripts/fetch-monaco-market.ts
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const KEY = process.env.PERPLEXITY_API_KEY;
if (!KEY) {
  console.error("❌ PERPLEXITY_API_KEY manquante");
  process.exit(1);
}

const year = new Date().getFullYear();
const prompt =
  `En ${year}, rédige un paragraphe FACTUEL et SOURCÉ (3 à 4 phrases, ~75 mots) sur le marché ` +
  `du bâtiment, de la rénovation et de la construction à Monaco (Principauté de Monaco). ` +
  `Mentionne, si pertinent : la nature haut de gamme du marché (immobilier parmi les plus chers ` +
  `au monde, rénovation et finitions de luxe), les contraintes d'un territoire d'environ 2 km² très ` +
  `dense (foncier rare, projets en hauteur et extensions sur la mer), et le fait qu'une grande part ` +
  `des artisans et entreprises du bâtiment interviennent depuis la Riviera française frontalière ` +
  `(Alpes-Maritimes : Beausoleil, Cap-d'Ail, Menton, Nice). ` +
  `RÈGLES : reste factuel, n'invente AUCUN chiffre non sourcé, pas de superlatif marketing. ` +
  `Réponds UNIQUEMENT en JSON valide : {"text":"<le paragraphe>"}`;

async function main() {
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
  if (!res.ok || !data?.choices) {
    console.error("API error", res.status, JSON.stringify(data).slice(0, 300));
    process.exit(1);
  }
  const content: string = data.choices[0]?.message?.content || "";
  const citations: string[] =
    (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results)
      ? data.search_results.map((s: { url?: string }) => s.url).filter(Boolean)
      : []) ||
    [];
  const m = content.match(/\{[\s\S]*\}/);
  let text = "";
  if (m) {
    text = (JSON.parse(m[0]).text || "")
      .replace(/\[\d+\]/g, "")
      .replace(/ {2,}/g, " ")
      .trim();
  }
  if (text.length < 60) {
    console.error("Texte trop court / parse KO:", content.slice(0, 200));
    process.exit(1);
  }
  const entry = {
    text,
    sources: citations.slice(0, 4),
    retrievedAt: new Date().toISOString().slice(0, 10),
  };
  console.log(`\n✓ ${entry.text.length} car. · ${entry.sources.length} sources · coût ≈ $${(data?.usage?.cost?.total_cost || 0).toFixed(4)}\n`);
  console.log('  "monaco": ' + JSON.stringify(entry, null, 2).replace(/\n/g, "\n  ") + ",");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
