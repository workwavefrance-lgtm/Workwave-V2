/**
 * Sourcing Perplexity pour les PAGES PILIER « urgence » (/[metier]/urgence).
 * 1er métier : serrurier (cluster « serrurier urgence » ~8k vol/mois + angle
 * anti-arnaque identifié par l'analyse SERP du 10/06 — personne ne joue la
 * transparence : la SERP vit de prix d'appel trompeurs « dès 39€ » vs ~150€ réels).
 *
 * Sortie : lib/data/urgence-content.ts (statique → ISR-safe, zéro requête au rendu).
 * Règle absolue : ZÉRO chiffre inventé — tout vient de sources web citées.
 *
 * Usage : npx tsx scripts/fetch-urgence-content.ts [--dry-run]
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const KEY = process.env.PERPLEXITY_API_KEY;
const DRY = process.argv.includes("--dry-run");
if (!KEY) {
  console.error("❌ PERPLEXITY_API_KEY manquante dans .env.local");
  process.exit(1);
}

const YEAR = new Date().getFullYear();

const PROMPT = `Tu es un expert du dépannage serrurerie en France. Recherche les données RÉELLES ${YEAR} (ou les plus récentes) sur le dépannage serrurier en urgence en France, et renvoie UNIQUEMENT un JSON strict (aucun texte autour) :

{
  "priceRanges": [
    { "label": "Ouverture de porte claquée (jour, semaine)", "low": <nombre>, "high": <nombre> },
    { "label": "Ouverture de porte verrouillée/blindée", "low": <nombre>, "high": <nombre> },
    { "label": "Remplacement de serrure standard", "low": <nombre>, "high": <nombre> },
    { "label": "Remplacement de cylindre", "low": <nombre>, "high": <nombre> }
  ],
  "majorations": "<phrase factuelle sur les majorations nuit/week-end/jours fériés constatées (en % ou €)>",
  "legalFacts": [
    "<3 à 5 faits RÉGLEMENTAIRES exacts et vérifiables : obligation de devis écrit avant intervention (arrêté du 24 janvier 2017, seuil), droit de rétractation et son exception en urgence, absence de réglementation des tarifs, recours DGCCRF/SignalConso>"
  ],
  "scamWarnings": [
    "<4 à 6 signaux d'arnaque CONCRETS documentés (DGCCRF, associations de consommateurs) : prix d'appel très bas puis facture gonflée, remplacement de serrure imposé alors qu'une ouverture simple suffit, absence de devis, matériel surfacturé, démarchage par prospectus imitant les services officiels>"
  ],
  "goodReflexes": [
    "<4 à 6 bons réflexes AVANT d'appeler : vérifier le SIRET de l'entreprise, exiger un devis écrit, demander le détail déplacement/main d'œuvre/pièces, contacter son assurance habitation (certaines couvrent l'ouverture de porte), porte claquée ≠ porte verrouillée>"
  ]
}

Contraintes : chiffres issus de sources web réelles uniquement. Pas de promesse de délai d'intervention. France métropolitaine.`;

async function main() {
  console.log(`Sourcing Perplexity — urgence serrurier (${YEAR})...`);
  if (DRY) {
    console.log("[DRY] Prompt prêt, aucun appel.");
    return;
  }
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: PROMPT }],
      temperature: 0.1,
    }),
  });
  if (!res.ok) throw new Error(`Perplexity ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content || "";
  const citations: string[] =
    (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results)
      ? data.search_results.map((s: { url?: string }) => s.url).filter(Boolean)
      : []) ||
    [];

  const m = content.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`Pas de JSON dans la réponse: ${content.slice(0, 300)}`);
  // retirer les marqueurs [N] de citation inline (leçon 31/05)
  const parsed = JSON.parse(m[0].replace(/\[\d+\]/g, ""));

  const out =
    `// Contenu sourcé via Perplexity API (recherche web + citations) — généré le ${new Date().toISOString().slice(0, 10)}.\n` +
    `// Régénérer : npx tsx scripts/fetch-urgence-content.ts\n` +
    `// RÈGLE : zéro chiffre inventé — tout chiffre affiché vient des sources listées.\n\n` +
    `export type UrgenceContent = {\n` +
    `  priceRanges: { label: string; low: number; high: number }[];\n` +
    `  majorations: string;\n` +
    `  legalFacts: string[];\n` +
    `  scamWarnings: string[];\n` +
    `  goodReflexes: string[];\n` +
    `  sources: string[];\n` +
    `  retrievedAt: string;\n` +
    `};\n\n` +
    `export const URGENCE_CONTENT: Record<string, UrgenceContent> = {\n` +
    `  serrurier: ${JSON.stringify(
      {
        priceRanges: parsed.priceRanges,
        majorations: parsed.majorations,
        legalFacts: parsed.legalFacts,
        scamWarnings: parsed.scamWarnings,
        goodReflexes: parsed.goodReflexes,
        sources: citations.slice(0, 6),
        retrievedAt: new Date().toISOString().slice(0, 10),
      },
      null,
      2
    ).replace(/\n/g, "\n  ")},\n};\n`;

  const dest = path.resolve(process.cwd(), "lib/data/urgence-content.ts");
  fs.writeFileSync(dest, out);
  console.log(`✓ écrit : ${dest}`);
  console.log(`  fourchettes : ${parsed.priceRanges?.length} · faits légaux : ${parsed.legalFacts?.length} · arnaques : ${parsed.scamWarnings?.length} · réflexes : ${parsed.goodReflexes?.length} · sources : ${citations.length}`);
  console.log("\nAperçu prix :");
  for (const r of parsed.priceRanges || []) console.log(`  • ${r.label} : ${r.low}–${r.high} €`);
  console.log(`  Majorations : ${parsed.majorations}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
