/**
 * Génère lib/data/barometre-be.ts : densité d'artisans par province en Belgique
 * francophone (Wallonie + Bruxelles). Pros = notre base (BCE). Population = somme
 * des communes (Statbel). 0 invention. Usage : npx tsx scripts/build-barometre-be.ts
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const PAGE = 1000;
async function all(t: string, s: string, f: (q: any) => any) {
  let o = 0, out: any[] = [];
  while (true) { const { data } = await f(sb.from(t).select(s)).range(o, o + PAGE - 1); const r = data || []; if (!r.length) break; out.push(...r); o += r.length; }
  return out;
}

async function main() {
  const cats = await all("categories", "id,vertical", (q: any) => q.in("vertical", ["btp", "domicile", "personne"]));
  const btpIds = cats.map((c: any) => c.id);
  const { data: prov } = await sb.from("departments").select("id,code,name,region").eq("country", "BE");
  const provIds = (prov || []).map((p: any) => p.id);
  const cities = await all("cities", "id,department_id,population", (q: any) => q.in("department_id", provIds));
  const cityByProv: Record<number, number[]> = {}, popByProv: Record<number, number> = {};
  for (const c of cities as any) { (cityByProv[c.department_id] ||= []).push(c.id); popByProv[c.department_id] = (popByProv[c.department_id] || 0) + (c.population || 0); }

  const rows: any[] = [];
  for (const p of prov || []) {
    const cids = cityByProv[p.id] || [];
    let cnt = 0;
    for (let i = 0; i < cids.length; i += 150) {
      const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
        .in("category_id", btpIds).eq("is_active", true).is("deleted_at", null).in("city_id", cids.slice(i, i + 150));
      cnt += count || 0;
    }
    const pop = popByProv[p.id] || 0;
    rows.push({ code: p.code, name: p.name, region: p.region, pros: cnt, population: pop, densite: pop > 0 ? +((cnt / pop) * 10000).toFixed(1) : 0 });
  }
  rows.sort((a, b) => b.densite - a.densite);
  rows.forEach((r, i) => (r.rank = i + 1));

  const total = rows.reduce((a, b) => a + b.pros, 0);
  const generatedAt = new Date().toISOString().slice(0, 10);
  const file =
    `// Baromètre artisans Belgique francophone (Wallonie + Bruxelles) par province.\n` +
    `// Généré le ${generatedAt} par scripts/build-barometre-be.ts. Pros = BCE (notre base),\n` +
    `// population = somme des communes (Statbel). 0 invention.\n\n` +
    `export type BeProvince = { rank: number; code: string; name: string; region: string; pros: number; population: number; densite: number };\n\n` +
    `export const BAROMETRE_BE: BeProvince[] = ${JSON.stringify(rows, null, 2)};\n\n` +
    `export const BAROMETRE_BE_META = { totalPros: ${total}, nbProvinces: ${rows.length}, generatedAt: ${JSON.stringify(generatedAt)}, prosSource: "Banque-Carrefour des Entreprises (BCE)", popSource: "Statbel (population des communes)" };\n`;
  fs.writeFileSync(path.resolve(process.cwd(), "lib/data/barometre-be.ts"), file);
  console.log(`${rows.length} provinces · ${total} pros · écrit lib/data/barometre-be.ts`);
  rows.forEach((r) => console.log(`  #${r.rank} ${r.code} ${r.name} ${r.densite}/10k`));
}
main().catch((e) => { console.error(e); process.exit(1); });
