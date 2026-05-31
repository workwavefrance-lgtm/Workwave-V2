/**
 * Audit GEO : sonde Perplexity (sonar) sur des requêtes type-utilisateur et
 * regarde QUI est cité — workwave.fr est-il dans les sources ? Qui domine ?
 *
 * Sortie : rapport console + ~/Desktop/Workwave-GEO-Audit.md
 * Coût : ~30 requêtes × $0.005 ≈ $0.15.
 *
 * Usage : npx tsx scripts/perplexity-geo-audit.ts
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
import os from "os";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const KEY = process.env.PERPLEXITY_API_KEY;
if (!KEY) {
  console.error("❌ PERPLEXITY_API_KEY manquante");
  process.exit(1);
}

// Requêtes réalistes : zones fortes (Vienne/NA), nouvelles régions, génériques.
const QUERIES: string[] = [
  "Comment trouver un plombier de confiance à Poitiers ?",
  "Meilleur électricien à Poitiers",
  "Trouver un maçon dans la Vienne",
  "Annuaire des artisans à Poitiers",
  "Comment choisir un couvreur à Châtellerault ?",
  "Plombier urgent à Poitiers",
  "Trouver un chauffagiste à Niort",
  "Devis peinture appartement Poitiers",
  "Trouver un carreleur à Limoges",
  "Électricien à Angoulême",
  "Annuaire plombier Charente-Maritime",
  "Trouver un menuisier dans la Vienne",
  "Paysagiste à Poitiers",
  "Comment trouver un bon artisan près de chez moi ?",
  "Site pour trouver un artisan BTP en Nouvelle-Aquitaine",
  "Trouver un serrurier à La Rochelle",
  "Rénovation salle de bain Poitiers artisan",
  "Trouver un plombier à Toulouse",
  "Meilleur électricien à Rennes",
  "Trouver un maçon à Nantes",
  "Couvreur à Montpellier devis",
  "Trouver un artisan à Marseille",
  "Plombier à Nice avis",
  "Comment trouver une femme de ménage à Poitiers ?",
  "Garde d'enfants à domicile Poitiers",
  "Soutien scolaire à Poitiers",
  "Trouver un jardinier dans la Vienne",
  "Prix pose carrelage au m2 en 2026",
  "Tarif horaire plombier France 2026",
  "Plateforme mise en relation artisans particuliers France",
];

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}

async function ask(q: string): Promise<{ domains: string[]; workwave: boolean; cost: number }> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sonar", temperature: 0.2, messages: [{ role: "user", content: q }] }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  const raw: string[] =
    (Array.isArray(d?.citations) ? d.citations : null) ||
    (Array.isArray(d?.search_results) ? d.search_results.map((s: { url?: string }) => s.url).filter(Boolean) : []) ||
    [];
  const domains = raw.map(domainOf);
  const workwave = domains.some((x) => x.includes("workwave.fr"));
  return { domains, workwave, cost: d?.usage?.cost?.total_cost || 0 };
}

async function main() {
  console.log(`Audit GEO — ${QUERIES.length} requêtes\n`);
  const rows: { q: string; workwave: boolean; top: string[] }[] = [];
  const domainCount = new Map<string, number>();
  let cited = 0;
  let total = 0;

  for (const q of QUERIES) {
    const r = await ask(q);
    total += r.cost;
    if (r.workwave) cited++;
    r.domains.forEach((dm) => domainCount.set(dm, (domainCount.get(dm) || 0) + 1));
    rows.push({ q, workwave: r.workwave, top: r.domains.slice(0, 3) });
    console.log(`  ${r.workwave ? "✅" : "❌"} ${q}`);
    await new Promise((res) => setTimeout(res, 1200));
  }

  const topDomains = Array.from(domainCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  console.log(`\n══════════════════════════════════════════`);
  console.log(`workwave.fr cité : ${cited}/${QUERIES.length} requêtes (${Math.round((cited / QUERIES.length) * 100)}%)`);
  console.log(`Coût ≈ $${total.toFixed(4)}`);
  console.log(`\nDomaines les plus cités (concurrents) :`);
  topDomains.forEach(([dm, n]) => console.log(`  ${String(n).padStart(2)}×  ${dm}`));

  // Rapport markdown
  const md =
    `# Audit GEO Workwave — ${new Date().toISOString().slice(0, 10)}\n\n` +
    `Sonde : Perplexity (sonar). ${QUERIES.length} requêtes type-utilisateur.\n\n` +
    `## Résultat clé\n\n` +
    `**workwave.fr cité dans ${cited}/${QUERIES.length} requêtes (${Math.round((cited / QUERIES.length) * 100)}%).**\n\n` +
    `## Domaines les plus cités par Perplexity (= qui gagne la visibilité IA)\n\n` +
    `| # | Domaine | Citations |\n|---|---|---|\n` +
    topDomains.map(([dm, n], i) => `| ${i + 1} | ${dm} | ${n} |`).join("\n") +
    `\n\n## Détail par requête\n\n` +
    `| Requête | workwave.fr ? | Top sources citées |\n|---|---|---|\n` +
    rows.map((r) => `| ${r.q} | ${r.workwave ? "✅ cité" : "❌ absent"} | ${r.top.join(", ")} |`).join("\n") +
    `\n`;
  const dest = path.join(os.homedir(), "Desktop", "Workwave-GEO-Audit.md");
  fs.writeFileSync(dest, md);
  console.log(`\n📝 Rapport écrit : ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
