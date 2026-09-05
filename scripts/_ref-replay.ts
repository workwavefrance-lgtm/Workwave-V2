import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import fs from "fs";
import { getServiceClient } from "../lib/supabase/service-client";
import { getTopProsByCategoryAndDepartment, computeProScore } from "../lib/queries/top-pros";
import { generateDepartmentSlug } from "../lib/utils/slugs";

async function main() {
  const sb = getServiceClient();
  const { data: deps } = await sb.from("departments").select("id,code,name,country");
  const bySlug = new Map<string, any>((deps ?? []).map((d: any) => [generateDepartmentSlug(d), d]));
  const { data: cats } = await sb.from("categories").select("id,slug,vertical");
  const catBySlug = new Map<string, any>((cats ?? []).map((c: any) => [c.slug, c]));

  const pages: any[] = JSON.parse(fs.readFileSync("/tmp/dept-pages.json", "utf8"));
  pages.sort((a, b) => b.i - a.i);
  const echantillon = pages.slice(0, 150);
  let examines = 0, moins10 = 0, doublonSiren = 0, sommeDistincts = 0, tie2 = 0, tie1 = 0, impTie = 0, impTot = 0, impDoublon = 0;
  const exemples: string[] = [];
  for (const pg of echantillon) {
    const m = pg.p.match(/^https:\/\/workwave\.fr\/([^/]+)\/([^/?#]+)$/);
    const cat = catBySlug.get(m[1]); const dep = bySlug.get(m[2]);
    if (!cat || !dep) continue;
    const { tops } = await getTopProsByCategoryAndDepartment(cat.id, dep.id, 10);
    examines++; impTot += pg.i;
    if (tops.length < 10) { moins10++; continue; }
    const sirens = tops.map((t: any) => String(t.siret ?? "").slice(0, 9));
    const nd = new Set(sirens).size; sommeDistincts += nd;
    if (nd < 10) { doublonSiren++; impDoublon += pg.i; if (exemples.length < 6) exemples.push(`${pg.p} -> ${nd}/10 entreprises distinctes (imp=${pg.i}, clics=${pg.c})`); }
    const sc = new Set(tops.map((t: any) => computeProScore(t))).size;
    if (sc <= 2) { tie2++; impTie += pg.i; }
    if (sc === 1) tie1++;
  }
  console.log(`--- REJEU sur les ${examines} pages DEPT qui ont reellement des impressions (top 150 par impressions) ---`);
  console.log(`  pages dont le Top affiche MOINS de 10 pros (pas de promesse de classement complet) : ${moins10}`);
  const base = examines - moins10;
  console.log(`  pages a 10 pros examinees : ${base}`);
  if (base > 0) {
    console.log(`  contenant >= 2 etablissements du meme SIREN : ${doublonSiren} (${(100*doublonSiren/base).toFixed(1)}% des pages a 10)`);
    console.log(`  entreprises distinctes moyennes : ${(sommeDistincts/base).toFixed(2)} / 10`);
    console.log(`  <= 2 scores distincts (ordre de fait alphabetique) : ${tie2} (${(100*tie2/base).toFixed(1)}%)  dont 1 seul score : ${tie1}`);
  }
  console.log(`  impressions couvertes par l echantillon : ${impTot} ; dont pages a doublon SIREN : ${impDoublon} ; dont pages "alphabetiques" : ${impTie}`);
  for (const e of exemples) console.log(`   ex: ${e}`);
}
main().catch(e => console.error(e));
