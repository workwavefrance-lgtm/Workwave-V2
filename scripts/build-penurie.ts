/**
 * Génère lib/data/barometre-penurie.ts : par métier bien couvert, les
 * départements où il manque le plus / le moins d'artisans (densité / 10 000 hab).
 * Pros = notre base (RPC barometre_cat_dept, SIRENE). Population = INSEE 2021 (/tmp/pop.csv).
 * Usage : npx tsx scripts/build-penurie.ts   (RPC ~1 min)
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const COVER_MIN = 85; // métier "featured" = présent dans >= 85 départements (comparaison juste)

function loadPop(): Record<string, number> {
  const raw = fs.readFileSync("/tmp/pop.csv", "utf8").trim().split("\n");
  const h = raw[0].split(",");
  const iD = h.indexOf("dep"), iP = h.indexOf("p21_pop");
  const out: Record<string, number> = {};
  for (let i = 1; i < raw.length; i++) { const c = raw[i].split(","); out[c[iD]] = Number(c[iP]) || 0; }
  return out;
}

async function main() {
  const pop = loadPop();
  const { data: depts } = await sb.from("departments").select("code,name,region").eq("country", "FR");
  const deptName: Record<string, { name: string; region: string }> = {};
  for (const d of depts || []) deptName[d.code] = { name: d.name, region: d.region };
  const { data: cats } = await sb.from("categories").select("slug,name,vertical").in("vertical", ["btp", "domicile", "personne"]);
  const catInfo: Record<string, { name: string; vertical: string }> = {};
  for (const c of cats || []) catInfo[c.slug] = { name: c.name, vertical: c.vertical };

  const t = Date.now();
  const { data, error } = await (sb as any).rpc("barometre_cat_dept");
  if (error) throw error;
  console.log(`RPC ok ${Date.now() - t}ms · ${data.length} combos`);

  // group by métier
  const byMetier: Record<string, Record<string, number>> = {}; // slug -> code -> count
  for (const r of data as { c: string; d: string; n: number }[]) {
    (byMetier[r.c] ||= {})[r.d] = r.n;
  }

  // Métropole uniquement (exclut les DOM 97x : couverture de scrape incomplète →
  // des « 0 » artefactuels qui ne sont pas de vraies pénuries). Cohérent avec la
  // carte (96 dépts métropolitains).
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
    `// Baromètre « déserts d'artisans » : par métier bien couvert, densité (entreprises\n` +
    `// référencées / 10 000 hab) par département. Pros = SIRENE (notre base), pop = INSEE 2021.\n` +
    `// Généré le ${generatedAt} par scripts/build-penurie.ts. NE PAS éditer à la main. 0 invention.\n\n` +
    `export type PenurieDept = { code: string; name: string; density: number; count: number };\n` +
    `export type PenurieMetier = {\n  slug: string; name: string; vertical: string; covered: number;\n` +
    `  totalCount: number; avgDensity: number;\n  scarcest: PenurieDept[]; densest: PenurieDept[];\n  byDept: Record<string, number>;\n};\n\n` +
    `export const PENURIE: PenurieMetier[] = ${JSON.stringify(metiers)};\n\n` +
    `export const PENURIE_META = { nbMetiers: ${metiers.length}, generatedAt: ${JSON.stringify(generatedAt)}, popSource: "INSEE population municipale 2021", prosSource: "Répertoire SIRENE (INSEE)" };\n`;
  fs.writeFileSync(path.resolve(process.cwd(), "lib/data/barometre-penurie.ts"), file);

  console.log(`\n${metiers.length} métiers featured (couverts >= ${COVER_MIN} dépts) :`);
  for (const m of metiers.slice(0, 12)) {
    console.log(`  ${m.name.padEnd(20)} moy ${m.avgDensity}/10k · manque le + : ${m.scarcest[0].name} (${m.scarcest[0].density}) · le + doté : ${m.densest[0].name} (${m.densest[0].density})`);
  }
  console.log(`\nécrit lib/data/barometre-penurie.ts`);
}
main().catch((e) => { console.error(e); process.exit(1); });
