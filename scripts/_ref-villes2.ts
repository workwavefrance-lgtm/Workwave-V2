import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import fs from "fs";
import { getServiceClient } from "../lib/supabase/service-client";
import { getTopProsByCategoryAndCity, computeProScore } from "../lib/queries/top-pros";

async function main() {
  const sb = getServiceClient();
  const { data: cats } = await sb.from("categories").select("id,slug,vertical");
  const catBySlug = new Map<string, any>((cats ?? []).map((c: any) => [c.slug, c]));
  const all: any[] = JSON.parse(fs.readFileSync("/tmp/ville-pages.json", "utf8"));
  const metier = all.filter(pg => { const m = pg.p.match(/^https:\/\/workwave\.fr\/([^/]+)\/([^/?#]+)$/); return m && catBySlug.has(m[1]); });
  const sum = (a: any[], k: string) => a.reduce((s: number, r: any) => s + (r[k] || 0), 0);
  console.log(`pages /[metier]/[ville] avec impressions (28j) : ${metier.length} ; ${sum(metier,"c")} clics ; ${sum(metier,"i")} impressions`);
  metier.sort((a, b) => (b.c - a.c) || (b.i - a.i));
  const ech = metier.slice(0, 250);
  let vus = 0, dix = 0, doublon = 0, tie2 = 0, clicTot = 0, clic10 = 0, clicDoublon = 0, clicTie = 0;
  const ex: string[] = [];
  for (const pg of ech) {
    const m = pg.p.match(/^https:\/\/workwave\.fr\/([^/]+)\/([^/?#]+)$/);
    const cat = catBySlug.get(m[1]);
    const { data: city } = await sb.from("cities").select("id").eq("slug", m[2]).limit(1).maybeSingle();
    if (!city) continue;
    const { tops } = await getTopProsByCategoryAndCity(cat.id, (city as any).id, 10);
    vus++; clicTot += pg.c;
    if (tops.length < 10) continue;
    dix++; clic10 += pg.c;
    const ids = tops.map((t: any) => t.id);
    const { data: sr } = await sb.from("pros").select("id,siret").in("id", ids);
    const byId = new Map((sr ?? []).map((r: any) => [r.id, String(r.siret ?? "")]));
    const nd = new Set(ids.map((id: number) => (byId.get(id) || `?${id}`).slice(0, 9))).size;
    if (nd < 10) { doublon++; clicDoublon += pg.c; if (ex.length < 6) ex.push(`${pg.p} ${nd}/10 SIREN (clics=${pg.c}, imp=${pg.i})`); }
    const sc = new Set(tops.map((t: any) => computeProScore(t))).size;
    if (sc <= 2) { tie2++; clicTie += pg.c; }
  }
  console.log(`--- ${vus} pages metier x ville resolues (les plus cliquees), ${clicTot} clics/28j ---`);
  console.log(`  affichant 10 pros : ${dix} (${(100*dix/vus).toFixed(1)}%) -> ${clic10} clics/28j`);
  if (dix) {
    console.log(`  dont doublon SIREN : ${doublon} (${(100*doublon/dix).toFixed(1)}%) -> ${clicDoublon} clics/28j`);
    console.log(`  dont ordre alphabetique (<=2 scores) : ${tie2} (${(100*tie2/dix).toFixed(1)}%) -> ${clicTie} clics/28j`);
  }
  for (const e of ex) console.log(`   ex: ${e}`);
}
main().catch(e => console.error(e));
