/**
 * Récupère le MODÈLE ÉCONOMIQUE RÉEL des plateformes concurrentes de mise en
 * relation artisans/particuliers en France (abonnement vs achat de lead vs
 * commission, prix indicatif, engagement, partage du lead), via Perplexity API.
 *
 * Sortie : lib/data/competitor-offers.ts (statique → ISR-safe).
 * Sert aux pages /pro/sans-abonnement et /pro/alternatives/[concurrent].
 *
 * RESPECTE « zéro chiffre inventé » : chaque donnée vient de sources web réelles,
 * CITÉES et DATÉES. Tout champ incertain est laissé `null` → la page ne l'affiche
 * pas (jamais d'affirmation non sourcée). Pub comparative légale (L121-8 C. conso)
 * = objective, vérifiable, non trompeuse, non dénigrante.
 *
 * Modèle : sonar (recherche web + citations). ~6 requêtes ≈ $0.05.
 * Usage : npx tsx scripts/fetch-competitor-offers.ts [--dry-run]
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

// slug -> nom officiel + URL connue (pour ancrer la recherche Perplexity)
const COMPETITORS: { slug: string; name: string; site: string }[] = [
  { slug: "habitatpresto", name: "Habitatpresto", site: "habitatpresto.com" },
  { slug: "travaux-com", name: "Travaux.com", site: "travaux.com" },
  { slug: "quotatis", name: "Quotatis", site: "quotatis.fr" },
  { slug: "hemea", name: "hemea", site: "hemea.com" },
  { slug: "allotravaux", name: "AlloTravaux", site: "allotravaux.com" },
  { slug: "starofservice", name: "StarOfService", site: "starofservice.com" },
];

type Offer = {
  slug: string;
  name: string;
  site: string;
  model: string | null; // "Abonnement mensuel" | "Achat de leads" | "Commission" | "Mixte"
  price_text: string | null; // libellé prix indicatif sourcé, ex "100 € à 150 € / mois"
  commitment: string | null; // "Engagement 3 à 12 mois" | "Sans engagement"
  leads_shared: string | null; // "Lead vendu à plusieurs artisans" etc.
  signup_fee: string | null;
  summary: string | null; // 1 phrase factuelle de synthèse
  sources: string[];
  retrievedAt: string;
};

function buildPrompt(name: string, site: string): string {
  const year = new Date().getFullYear();
  return (
    `Tu es analyste de marché. En France en ${year}, décris le MODÈLE ÉCONOMIQUE FACTUREL ` +
    `facturé AUX ARTISANS/PROFESSIONNELS par la plateforme "${name}" (site ${site}), ` +
    `plateforme de mise en relation entre particuliers et professionnels du bâtiment / travaux.\n\n` +
    `Donne UNIQUEMENT des informations vérifiables issues de sources web récentes et fiables ` +
    `(site officiel, avis pros, articles spécialisés). Si une donnée est inconnue ou incertaine, ` +
    `mets null — n'invente JAMAIS un chiffre.\n\n` +
    `Champs demandés :\n` +
    `- model : type de facturation au pro ("Abonnement mensuel", "Achat de leads / crédits", "Commission sur devis", "Mixte", ou null)\n` +
    `- price_text : fourchette de prix indicative payée par le pro, avec unité (ex "100 € à 150 € / mois", "15 € à 40 € / lead"), ou null\n` +
    `- commitment : durée d'engagement (ex "Engagement 3 à 12 mois", "Sans engagement"), ou null\n` +
    `- leads_shared : est-ce que le même lead/projet est vendu à plusieurs artisans à la fois ? (ex "Lead partagé jusqu'à 4-5 artisans", "Exclusif"), ou null\n` +
    `- signup_fee : frais d'inscription/dossier éventuels, ou null\n` +
    `- summary : UNE phrase factuelle neutre résumant le modèle pour un artisan (max 200 caractères)\n\n` +
    `Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant/après), au format EXACT :\n` +
    `{"model":"...","price_text":"...","commitment":"...","leads_shared":"...","signup_fee":"...","summary":"..."}\n` +
    `Utilise null (sans guillemets) pour tout champ inconnu.`
  );
}

async function fetchOne(c: { slug: string; name: string; site: string }): Promise<{ offer: Offer | null; cost: number }> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      temperature: 0.1,
      messages: [{ role: "user", content: buildPrompt(c.name, c.site) }],
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const cost = data?.usage?.cost?.total_cost || 0;
  if (!res.ok || !data?.choices) {
    console.log(`  ✗ ${c.slug}: API error ${res.status} ${JSON.stringify(data).slice(0, 120)}`);
    return { offer: null, cost };
  }
  const content: string = data.choices[0]?.message?.content || "";
  const citations: string[] =
    (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results) ? data.search_results.map((s: { url?: string }) => s.url).filter(Boolean) : []) ||
    [];
  const m = content.match(/\{[\s\S]*\}/);
  if (!m) {
    console.log(`  ✗ ${c.slug}: pas de JSON`);
    return { offer: null, cost };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(m[0]);
  } catch {
    console.log(`  ✗ ${c.slug}: JSON invalide`);
    return { offer: null, cost };
  }
  const clean = (v: unknown): string | null => {
    if (v == null) return null;
    const s = String(v).replace(/\[\d+\]/g, "").trim(); // retire marqueurs [N]
    return s.length > 0 && s.toLowerCase() !== "null" ? s : null;
  };
  const offer: Offer = {
    slug: c.slug,
    name: c.name,
    site: c.site,
    model: clean(parsed.model),
    price_text: clean(parsed.price_text),
    commitment: clean(parsed.commitment),
    leads_shared: clean(parsed.leads_shared),
    signup_fee: clean(parsed.signup_fee),
    summary: clean(parsed.summary),
    sources: citations.slice(0, 4),
    retrievedAt: new Date().toISOString().slice(0, 10),
  };
  return { offer, cost };
}

async function main() {
  const list = DRY ? COMPETITORS.slice(0, 1) : COMPETITORS;
  console.log(`Fetch modèles concurrents Perplexity — ${list.length} plateformes${DRY ? " (DRY RUN)" : ""}\n`);
  const out: Record<string, Offer> = {};
  let total = 0;
  for (const c of list) {
    const { offer, cost } = await fetchOne(c);
    total += cost;
    if (offer) {
      out[c.slug] = offer;
      console.log(`  ✓ ${c.slug.padEnd(16)} model=${offer.model ?? "?"} · price=${offer.price_text ?? "?"} · ${offer.sources.length} sources`);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\nOK : ${Object.keys(out).length}/${list.length} · coût ≈ $${total.toFixed(4)}`);
  if (DRY) {
    console.log("\nDRY RUN — aperçu complet :\n", JSON.stringify(out, null, 2));
    return;
  }
  const file =
    `// Modèles économiques concurrents sourcés via Perplexity API (web + citations).\n` +
    `// Généré le ${new Date().toISOString().slice(0, 10)}. NE PAS éditer à la main :\n` +
    `// relancer \`npx tsx scripts/fetch-competitor-offers.ts\`.\n` +
    `// « zéro chiffre inventé » : données issues de sources web réelles, citées + datées.\n` +
    `// Tout champ null = donnée non confirmée → la page ne l'affiche pas.\n\n` +
    `export type CompetitorOffer = {\n` +
    `  slug: string;\n  name: string;\n  site: string;\n` +
    `  model: string | null;\n  price_text: string | null;\n  commitment: string | null;\n` +
    `  leads_shared: string | null;\n  signup_fee: string | null;\n  summary: string | null;\n` +
    `  sources: string[];\n  retrievedAt: string;\n};\n\n` +
    `export const COMPETITOR_OFFERS: Record<string, CompetitorOffer> = ${JSON.stringify(out, null, 2)};\n`;
  const dest = path.resolve(process.cwd(), "lib/data/competitor-offers.ts");
  fs.writeFileSync(dest, file);
  console.log(`\n📝 Écrit ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
