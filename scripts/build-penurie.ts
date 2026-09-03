/**
 * Genere lib/data/barometre-penurie.ts : par metier bien couvert, les
 * departements ou il manque le plus / le moins d'artisans (densite / 10 000 hab).
 * Pros = fiches OUVERTES de notre base (etablissements non fermes d'apres le
 * registre Sirene, regle FILTRE_OUVERTS ; avant le 03/09/2026 les fermes
 * etaient comptes). Population = INSEE 2021 (cf. chargerPopulationDepts).
 * Donnees : scripts/lib/stats-etats.ts (RPC ou extraction, cf. son en-tete).
 * Usage : npx tsx scripts/build-penurie.ts [--extraire]
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { chargerStatsEtats, chargerPopulationDepts, CLASSEMENT_SIRENE_DU } from "./lib/stats-etats";

const COVER_MIN = 85; // metier "featured" = present dans >= 85 departements (comparaison juste)
const VERTICAUX = ["btp", "domicile", "personne"];

async function main() {
  const debut = Date.now();
  const sb = getServiceClient();
  const { parDept: popDepts, source: popSource } = await chargerPopulationDepts();
  const pop: Record<string, number> = {};
  for (const [code, p] of Object.entries(popDepts)) pop[code] = p.pop;
  console.log(`Population : ${popSource}`);

  const { data: depts } = await sb.from("departments").select("code,name,region").eq("country", "FR");
  const deptName: Record<string, { name: string; region: string }> = {};
  for (const d of depts || []) deptName[d.code] = { name: d.name, region: d.region };
  const { data: cats } = await sb.from("categories").select("slug,name,vertical").in("vertical", VERTICAUX);
  const catInfo: Record<string, { name: string; vertical: string }> = {};
  for (const c of cats || []) catInfo[c.slug] = { name: c.name, vertical: c.vertical };

  const etats = await chargerStatsEtats({ forcerExtraction: process.argv.includes("--extraire") });

  // group by metier -> code dept -> fiches ouvertes
  const byMetier: Record<string, Record<string, number>> = {};
  for (const l of etats.lignes) {
    if (!VERTICAUX.includes(l.vertical) || l.k !== "FR" || !l.d) continue;
    (byMetier[l.c] ||= {})[l.d] = (byMetier[l.c][l.d] || 0) + l.o;
  }

  // Metropole uniquement (exclut les DOM 97x : couverture de scrape incomplete ->
  // des « 0 » artefactuels qui ne sont pas de vraies penuries). Coherent avec la
  // carte (96 depts metropolitains).
  const allDeptCodes = Object.keys(deptName).filter((c) => pop[c] > 0 && !c.startsWith("97"));

  const metiers = Object.keys(byMetier)
    .map((slug) => {
      const counts = byMetier[slug];
      const rows = allDeptCodes.map((code) => {
        const count = counts[code] || 0;
        const density = +((count / pop[code]) * 10000).toFixed(1);
        return { code, name: deptName[code]?.name || code, density, count };
      });
      const covered = rows.filter((r) => r.count > 0).length;
      const totalCount = rows.reduce((a, b) => a + b.count, 0);
      const totalPop = allDeptCodes.reduce((a, c) => a + pop[c], 0);
      const avgDensity = +((totalCount / totalPop) * 10000).toFixed(1);
      const sorted = [...rows].sort((a, b) => a.density - b.density);
      const byDept: Record<string, number> = {};
      for (const r of rows) byDept[r.code] = r.density;
      return {
        slug, name: catInfo[slug]?.name || slug, vertical: catInfo[slug]?.vertical || "btp",
        covered, totalCount, avgDensity,
        scarcest: sorted.slice(0, 5),
        densest: [...sorted].reverse().slice(0, 3),
        byDept,
      };
    })
    .filter((m) => m.covered >= COVER_MIN)
    .sort((a, b) => b.totalCount - a.totalCount);

  const generatedAt = new Date().toISOString().slice(0, 10);
  const file =
    `// Barometre « deserts d'artisans » : par metier bien couvert, densite (fiches OUVERTES\n` +
    `// referencees / 10 000 hab) par departement. Pros = SIRENE (notre base, etablissements non\n` +
    `// fermes, classement Sirene du ${CLASSEMENT_SIRENE_DU}), pop = INSEE 2021.\n` +
    `// Genere le ${generatedAt} par scripts/build-penurie.ts (donnees : ${etats.source}). NE PAS editer a la main. 0 invention.\n\n` +
    `export type PenurieDept = { code: string; name: string; density: number; count: number };\n` +
    `export type PenurieMetier = {\n  slug: string; name: string; vertical: string; covered: number;\n` +
    `  totalCount: number; avgDensity: number;\n  scarcest: PenurieDept[]; densest: PenurieDept[];\n  byDept: Record<string, number>;\n};\n\n` +
    `export const PENURIE: PenurieMetier[] = ${JSON.stringify(metiers)};\n\n` +
    `export const PENURIE_META = { nbMetiers: ${metiers.length}, generatedAt: ${JSON.stringify(generatedAt)}, classementDu: ${JSON.stringify(CLASSEMENT_SIRENE_DU)}, popSource: "INSEE population municipale 2021", prosSource: "Répertoire SIRENE (INSEE), établissements ouverts" };\n`;
  fs.writeFileSync(path.resolve(process.cwd(), "lib/data/barometre-penurie.ts"), file);

  console.log(`\n${metiers.length} metiers featured (couverts >= ${COVER_MIN} depts) :`);
  for (const m of metiers.slice(0, 12)) {
    console.log(`  ${m.name.padEnd(20)} moy ${m.avgDensity}/10k · manque le + : ${m.scarcest[0].name} (${m.scarcest[0].density}) · le + dote : ${m.densest[0].name} (${m.densest[0].density})`);
  }
  console.log(`\necrit lib/data/barometre-penurie.ts · ${Math.round((Date.now() - debut) / 1000)} s`);
}
main().catch((e) => { console.error(e); process.exit(1); });
