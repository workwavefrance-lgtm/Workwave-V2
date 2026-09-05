import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

// Motifs EXACTS proposes par l'agent (traduits en JS, insensible a la casse
// comme le fait le scraper BTP suppose)
const R_8121Z = /\b(NETTOYAGE|PROPRETE|HYGIENE)/i;
const R_8129A = /\b(NUISIBLE|DERATISATION|DESINSECTISATION|DESINFECTION|3D)/i;
const R_8559B = /\bCOURS\b/i;

async function lireNoms(catId: number, naf: string, max = 4000) {
  const noms: string[] = [];
  let offset = 0;
  while (noms.length < max) {
    const { data, error } = await sb
      .from("pros").select("name").eq("category_id", catId).eq("naf_code", naf)
      .range(offset, offset + 999);
    if (error) throw error;
    const rows = data || [];
    if (rows.length === 0) break;
    noms.push(...rows.map((r: any) => r.name));
    offset += rows.length;
  }
  return noms;
}

function pct(n: number, d: number) { return d === 0 ? "n/a" : ((100 * n) / d).toFixed(1) + " %"; }

async function main() {
  // --- 8121Z : le motif est cense DETACHER nettoyage-pro de menage ---
  const menage = await lireNoms(19, "8121Z");
  const mMatch = menage.filter((n) => R_8121Z.test(n));
  console.log(`\n=== 8121Z, motif (NETTOYAGE|PROPRETE|HYGIENE) ===`);
  console.log(`noms de menage(19) testes : ${menage.length}`);
  console.log(`captures vers nettoyage-pro : ${mMatch.length} (${pct(mMatch.length, menage.length)})`);
  console.log(`exemples captures : ${mMatch.slice(0, 12).map(s=>JSON.stringify(s)).join(", ")}`);
  console.log(`exemples NON captures : ${menage.filter(n=>!R_8121Z.test(n)).slice(0,8).map(s=>JSON.stringify(s)).join(", ")}`);

  // controle : le motif capture-t-il aussi les vrais nettoyage-pro 8121Z ?
  const np = await lireNoms(40, "8121Z");
  const npMatch = np.filter((n) => R_8121Z.test(n));
  console.log(`noms de nettoyage-pro(40) en 8121Z : ${np.length}, captures : ${npMatch.length} (${pct(npMatch.length, np.length)})`);

  // --- 8129A : motif nuisibles ---
  const n8129 = await lireNoms(40, "8129A");
  const m8129 = n8129.filter((n) => R_8129A.test(n));
  console.log(`\n=== 8129A, motif (NUISIBLE|DERATISATION|DESINSECTISATION|DESINFECTION|3D) ===`);
  console.log(`noms 8129A testes : ${n8129.length}`);
  console.log(`captures vers traitement-nuisibles : ${m8129.length} (${pct(m8129.length, n8129.length)})`);
  console.log(`exemples captures : ${m8129.slice(0, 15).map(s=>JSON.stringify(s)).join(", ")}`);
  const seul3D = n8129.filter((n) => /\b3D/i.test(n));
  console.log(`dont captures par le SEUL jeton "3D" : ${seul3D.length} -> ${seul3D.slice(0,15).map(s=>JSON.stringify(s)).join(", ")}`);

  // --- 8559B : motif COURS ---
  const ss = await lireNoms(29, "8559B");
  const cp = await lireNoms(32, "8559B");
  console.log(`\n=== 8559B, motif \\bCOURS\\b ===`);
  console.log(`soutien-scolaire(29) en 8559B : ${ss.length}, captures (=deplaces vers cours-particuliers) : ${ss.filter(n=>R_8559B.test(n)).length} (${pct(ss.filter(n=>R_8559B.test(n)).length, ss.length)})`);
  console.log(`cours-particuliers(32) en 8559B : ${cp.length}, captures (=conserves) : ${cp.filter(n=>R_8559B.test(n)).length} (${pct(cp.filter(n=>R_8559B.test(n)).length, cp.length)})`);
  console.log(`exemples cours-particuliers NON captures (repli vers soutien-scolaire) : ${cp.filter(n=>!R_8559B.test(n)).slice(0,15).map(s=>JSON.stringify(s)).join(", ")}`);
  console.log(`exemples soutien-scolaire captures a tort ? : ${ss.filter(n=>R_8559B.test(n)).slice(0,15).map(s=>JSON.stringify(s)).join(", ")}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
