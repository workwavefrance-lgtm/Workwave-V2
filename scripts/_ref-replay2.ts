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
  let examines = 0, moins10 = 0, doublon = 0, sommeDistincts = 0, tie2 = 0, tie1 = 0;
  let impTot = 0, impDoublon = 0, impTie = 0, clicTot = 0, clicDoublon = 0, clicTie = 0;
  const exemples: string[] = [];
  for (const pg of echantillon) {
    const m = pg.p.match(/^https:\/\/workwave\.fr\/([^/]+)\/([^/?#]+)$/);
    const cat = catBySlug.get(m[1]); const dep = bySlug.get(m[2]);
    if (!cat || !dep) continue;
    const { tops } = await getTopProsByCategoryAndDepartment(cat.id, dep.id, 10);
    examines++; impTot += pg.i; clicTot += pg.c;
    if (tops.length < 10) { moins10++; continue; }
    const ids = tops.map((t: any) => t.id);
    const { data: sr } = await sb.from("pros").select("id,siret,name").in("id", ids);
    const siretById = new Map((sr ?? []).map((r: any) => [r.id, String(r.siret ?? "")]));
    const sirens = ids.map((id: number) => (siretById.get(id) || `?${id}`).slice(0, 9));
    const nd = new Set(sirens).size; sommeDistincts += nd;
    if (nd < 10) { doublon++; impDoublon += pg.i; clicDoublon += pg.c;
      if (exemples.length < 8) exemples.push(`${pg.p} -> ${nd}/10 SIREN distincts (imp=${pg.i}, clics=${pg.c})`); }
    const sc = new Set(tops.map((t: any) => computeProScore(t))).size;
    if (sc <= 2) { tie2++; impTie += pg.i; clicTie += pg.c; }
    if (sc === 1) tie1++;
  }
  const base = examines - moins10;
  console.log(`--- REJEU, ${examines} pages DEPT a impressions reelles (28j), dont ${base} affichant 10 pros ---`);
  console.log(`  >= 2 etablissements du meme SIREN : ${doublon} / ${base} (${(100*doublon/base).toFixed(1)}%)`);
  console.log(`  SIREN distincts moyens dans un Top 10 : ${(sommeDistincts/base).toFixed(2)}`);
  console.log(`  <= 2 scores distincts (tri de fait alphabetique) : ${tie2} (${(100*tie2/base).toFixed(1)}%) dont 1 seul score : ${tie1}`);
  console.log(`  POIDS REEL : echantillon = ${impTot} impressions et ${clicTot} clics sur 28 jours`);
  console.log(`    pages a doublon : ${impDoublon} imp / ${clicDoublon} clics`);
  console.log(`    pages alphabetiques : ${impTie} imp / ${clicTie} clics`);
  for (const e of exemples) console.log(`   ex: ${e}`);
}
main().catch(e => console.error(e));
