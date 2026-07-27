/**
 * Génère lib/data/barometre-artisans.ts : classement densité d'entreprises
 * artisanales par département.
 *   - Comptage des pros = NOTRE base (RPC barometre_dept_artisans, source SIRENE).
 *   - Population = INSEE population municipale 2021 (p21_pop), fichier data.gouv
 *     (/tmp/pop.csv, cf. dataset 65b1a75892f5a30b16f72943).
 * Densité = pros / population * 10 000. 0 invention. Mayotte exclu (pas de pop INSEE).
 * Usage : npx tsx scripts/build-barometre.ts   (RPC ~1 min)
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function loadInsee(): Record<string, { pop: number; superf: number }> {
  const raw = fs.readFileSync("/tmp/pop.csv", "utf8").trim().split("\n");
  const header = raw[0].split(",");
  const iDep = header.indexOf("dep"), iPop = header.indexOf("p21_pop"), iSup = header.indexOf("superf");
  const out: Record<string, { pop: number; superf: number }> = {};
  for (let i = 1; i < raw.length; i++) {
    const c = raw[i].split(",");
    out[c[iDep]] = { pop: Number(c[iPop]) || 0, superf: Number(c[iSup]) || 0 };
  }
  return out;
}

async function main() {
  const insee = loadInsee();
  const t = Date.now();
  const { data, error } = await (sb as any).rpc("barometre_dept_artisans");
  if (error) throw error;
  console.log(`RPC ok en ${Date.now() - t}ms · ${data.length} départements`);

  const rows = data
    .map((r: any) => {
      const ins = insee[r.code];
      if (!ins || ins.pop <= 0) return null; // Mayotte etc. sans pop INSEE → exclus
      return {
        code: r.code,
        name: r.name,
        region: r.region,
        pros: r.pros as number,
        population: ins.pop,
        superficie: ins.superf,
        densite: +((r.pros / ins.pop) * 10000).toFixed(1),
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.densite - a.densite)
    .map((r: any, i: number) => ({ ...r, rank: i + 1 }));

  const totalPros = rows.reduce((a: number, b: any) => a + b.pros, 0);
  const generatedAt = new Date().toISOString().slice(0, 10);

  const file =
    `// Baromètre densité d'entreprises artisanales par département.\n` +
    `// Généré le ${generatedAt} par scripts/build-barometre.ts — NE PAS éditer à la main.\n` +
    `// Pros = notre base (source SIRENE). Population = INSEE population municipale 2021 (data.gouv).\n` +
    `// Densité = entreprises référencées / population * 10 000. 0 invention.\n\n` +
    `export type BarometreDept = {\n  rank: number; code: string; name: string; region: string;\n` +
    `  pros: number; population: number; superficie: number; densite: number;\n};\n\n` +
    `export const BAROMETRE_ARTISANS: BarometreDept[] = ${JSON.stringify(rows, null, 2)};\n\n` +
    `export const BAROMETRE_META = {\n` +
    `  totalPros: ${totalPros},\n  nbDepts: ${rows.length},\n` +
    `  popSource: "INSEE, population municipale 2021",\n` +
    `  prosSource: "Répertoire SIRENE (INSEE)",\n` +
    `  generatedAt: ${JSON.stringify(generatedAt)},\n};\n`;
  fs.writeFileSync(path.resolve(process.cwd(), "lib/data/barometre-artisans.ts"), file);

  const fmt = (r: any) => `#${String(r.rank).padStart(3)} ${r.code.padStart(3)} ${r.name.slice(0, 22).padEnd(22)} ${String(r.pros).padStart(6)} ent. · ${String(r.population).padStart(9)} hab · ${r.densite}/10k`;
  console.log("\n=== TOP 10 ===");
  rows.slice(0, 10).forEach((r: any) => console.log(fmt(r)));
  console.log("\n=== BOTTOM 10 ===");
  rows.slice(-10).forEach((r: any) => console.log(fmt(r)));
  console.log(`\nTotal: ${totalPros} entreprises · ${rows.length} départements · écrit lib/data/barometre-artisans.ts`);
}
main().catch((e) => { console.error(e); process.exit(1); });
