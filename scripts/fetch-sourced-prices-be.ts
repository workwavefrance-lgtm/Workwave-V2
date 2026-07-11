/**
 * Récupère des fourchettes de prix 2025 RÉELLES + sources via Perplexity API,
 * pour remplacer les PRICE_RANGES hardcodés de lib/seo/seo-sections.ts.
 *
 * Sortie : lib/data/sourced-prices-be.ts (statique → ISR-safe, aucune requête au rendu).
 * Le helper seo-sections.ts lira ce fichier en priorité (fallback hardcodé sinon).
 *
 * 1 requête Perplexity par catégorie (~13) ≈ $0.07 total.
 * Modèle : sonar (recherche web + citations). Respecte « zéro chiffre inventé » :
 * les chiffres viennent de sources web réelles, citées.
 *
 * Usage : npx tsx scripts/fetch-sourced-prices.ts [--dry-run]
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

// slug -> nom pour le prompt
const NOM: Record<string, string> = {
  plombier: "plombier",
  electricien: "électricien",
  macon: "maçon",
  peintre: "peintre en bâtiment",
  carreleur: "carreleur",
  menuisier: "menuisier",
  couvreur: "couvreur",
  chauffagiste: "chauffagiste",
  jardinage: "jardinier / service de jardinage",
  menage: "service de ménage à domicile",
  "soutien-scolaire": "professeur de soutien scolaire (cours particuliers)",
  "garde-enfants": "service de garde d'enfants à domicile",
  "aide-seniors": "service d'aide à domicile pour personnes âgées",
};

// slug -> libellés exacts (copiés de PRICE_RANGES, source de vérité des prestations)
const CATS: Record<string, string[]> = {
  plombier: ["Intervention de dépannage simple", "Recherche de fuite non destructive", "Remplacement de chauffe-eau électrique", "Rénovation complète de salle de bain", "Débouchage de canalisation"],
  electricien: ["Diagnostic et dépannage simple", "Remplacement d'un disjoncteur", "Pose de prise (par unité)", "Mise aux normes NF C 15-100 (100 m²)", "Tableau électrique complet"],
  macon: ["Terrasse béton (par m²)", "Ouverture mur porteur", "Ravalement de façade (par m²)", "Extension maison (par m²)", "Pose de parpaings (par m²)"],
  peintre: ["Peinture mur (par m²)", "Peinture plafond (par m²)", "Pièce complète (10-15 m²)", "Ravalement façade (par m²)", "Pose papier peint (par m²)"],
  carreleur: ["Pose de carrelage au sol (par m²)", "Faïence murale (par m²)", "Carrelage grand format (par m²)", "Douche à l'italienne complète", "Carrelage extérieur (par m²)"],
  menuisier: ["Pose de fenêtre (par fenêtre)", "Escalier sur mesure", "Pose de parquet (par m²)", "Placard sur mesure", "Porte intérieure pose comprise"],
  couvreur: ["Réfection complète de toiture (par m²)", "Réparation de tuiles", "Pose de gouttières (par mètre linéaire)", "Pose de Velux", "Démoussage de toiture (par m²)"],
  chauffagiste: ["Entretien annuel de chaudière", "Installation de chaudière gaz", "Pompe à chaleur air/eau", "Remplacement de chauffe-eau", "Désembouage du circuit"],
  jardinage: ["Tonte de pelouse (par heure)", "Taille de haie (par mètre linéaire)", "Élagage d'arbre", "Entretien régulier (forfait mensuel)", "Création de massif"],
  menage: ["Ménage régulier à domicile (par heure)", "Nettoyage complet de printemps", "Ménage après travaux", "Lavage de vitres (par m²)", "Repassage à domicile (par heure)"],
  "soutien-scolaire": ["Cours particulier primaire (par heure)", "Cours particulier collège (par heure)", "Cours particulier lycée (par heure)", "Préparation au brevet ou baccalauréat", "Stage intensif vacances (semaine)"],
  "garde-enfants": ["Garde à domicile (par heure)", "Sortie d'école + goûter (par jour)", "Babysitting soirée", "Garde partagée (par famille)", "Garde de nuit ou week-end"],
  "aide-seniors": ["Aide à domicile (par heure)", "Aide à la toilette", "Accompagnement RDV médical", "Garde de jour ponctuelle", "Forfait mensuel régulier"],
};

type Range = { label: string; range: string };
type Entry = { ranges: Range[]; sources: string[]; retrievedAt: string };

function buildPrompt(slug: string, labels: string[]): string {
  const metier = NOM[slug] || slug;
  const year = new Date().getFullYear();
  return (
    `En BELGIQUE (Wallonie et Bruxelles) en ${year}, indique la fourchette de prix moyenne TVAC (TVA comprise) FACTURÉE PAR UN ARTISAN/ENTREPRENEUR pour un ${metier}, ` +
    `pour CHACUNE de ces prestations précises, en te basant sur des sources web BELGES récentes et fiables (prix en euros, marché belge — PAS français) :\n` +
    labels.map((l, i) => `${i + 1}. ${l}`).join("\n") +
    `\n\nRÈGLES IMPÉRATIVES :\n` +
    `- Prix TOUT COMPRIS (fourniture + pose/main d'œuvre) dès que la prestation implique une installation — JAMAIS le prix du matériel seul.\n` +
    `- Une fourchette DISTINCTE, spécifique et réaliste pour CHAQUE prestation — n'utilise jamais deux fois la même fourchette.\n` +
    `- Chiffres conformes au marché BELGE (Wallonie/Bruxelles), prix TVAC, ce que paie réellement un particulier belge.\n\n` +
    `Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant ou après), au format EXACT :\n` +
    `{"ranges":[{"label":"<le libellé exact fourni>","range":"<ex: 80 € à 150 €>"}]}\n` +
    `Garde les libellés STRICTEMENT identiques et dans le MÊME ordre.`
  );
}

async function fetchCat(slug: string, labels: string[]): Promise<{ entry: Entry | null; cost: number }> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      temperature: 0.1,
      messages: [{ role: "user", content: buildPrompt(slug, labels) }],
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const cost = data?.usage?.cost?.total_cost || 0;
  if (!res.ok || !data?.choices) {
    console.log(`  ✗ ${slug}: API error ${res.status} ${JSON.stringify(data).slice(0, 120)}`);
    return { entry: null, cost };
  }
  const content: string = data.choices[0]?.message?.content || "";
  const citations: string[] =
    (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results) ? data.search_results.map((s: { url?: string }) => s.url).filter(Boolean) : []) ||
    [];
  const m = content.match(/\{[\s\S]*\}/);
  if (!m) {
    console.log(`  ✗ ${slug}: pas de JSON dans la réponse`);
    return { entry: null, cost };
  }
  let parsed: { ranges?: Range[] };
  try {
    parsed = JSON.parse(m[0]);
  } catch {
    console.log(`  ✗ ${slug}: JSON invalide`);
    return { entry: null, cost };
  }
  const got = parsed.ranges || [];
  // Alignement par index sur NOS libellés (robuste si Perplexity reformule légèrement)
  const ranges: Range[] = labels
    .map((label, i) => ({ label, range: (got[i]?.range || "").trim() }))
    .filter((r) => r.range.length > 0 && /\d/.test(r.range));
  if (ranges.length === 0) {
    console.log(`  ✗ ${slug}: 0 fourchette exploitable`);
    return { entry: null, cost };
  }
  return {
    entry: { ranges, sources: citations.slice(0, 4), retrievedAt: new Date().toISOString().slice(0, 10) },
    cost,
  };
}

async function main() {
  console.log(`Fetch prix sourcés Perplexity — ${Object.keys(CATS).length} catégories${DRY ? " (DRY RUN, 1 cat)" : ""}\n`);
  const out: Record<string, Entry> = {};
  let total = 0;
  const entries = DRY ? Object.entries(CATS).slice(0, 1) : Object.entries(CATS);
  for (const [slug, labels] of entries) {
    const { entry, cost } = await fetchCat(slug, labels);
    total += cost;
    if (entry) {
      out[slug] = entry;
      console.log(`  ✓ ${slug.padEnd(16)} ${entry.ranges.length} prix · ${entry.sources.length} sources`);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\nOK : ${Object.keys(out).length}/${entries.length} catégories · coût ≈ $${total.toFixed(4)}`);
  if (DRY) {
    console.log("\nDRY RUN — aperçu :\n", JSON.stringify(out, null, 2));
    return;
  }
  const file =
    `// Prix BELGES sourcés via Perplexity API (recherche web + citations, prix TVAC) — généré le ${new Date().toISOString().slice(0, 10)}.\n` +
    `// NE PAS éditer à la main : relancer \`npx tsx scripts/fetch-sourced-prices.ts\`.\n` +
    `// Respecte « zéro chiffre inventé » : chiffres issus de sources web réelles, citées.\n\n` +
    `export type SourcedPrice = { label: string; range: string };\n` +
    `export type SourcedPriceEntry = { ranges: SourcedPrice[]; sources: string[]; retrievedAt: string };\n\n` +
    `export const SOURCED_PRICES_BE: Record<string, SourcedPriceEntry> = ${JSON.stringify(out, null, 2)};\n`;
  const dest = path.resolve(process.cwd(), "lib/data/sourced-prices-be.ts");
  fs.writeFileSync(dest, file);
  console.log(`\n📝 Écrit ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
