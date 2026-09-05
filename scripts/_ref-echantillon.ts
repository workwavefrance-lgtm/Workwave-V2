import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const combos: {m:string;v:string;n:number}[] = []; let off = 0;
  while (true) {
    const { data } = await (sb as any).rpc("sitemap_listings_page", { p_offset: off, p_limit: 20000 });
    const rows = (data||[]) as any[]; if (!rows.length) break; combos.push(...rows); off += rows.length; if (rows.length < 20000) break;
  }
  const declared = new Set(fs.readFileSync("/tmp/sm2urls.txt","utf8").trim().split("\n"));
  const gsc = JSON.parse(fs.readFileSync("/tmp/gsc-pages-aout.json","utf8"));
  const avecImp = new Set(gsc.map((r:any)=>String(r.keys[0]).replace(/^https:\/\/workwave\.fr\//,"").replace(/\/$/,"")));
  const cible = combos.filter(c => !declared.has(`${c.m}/${c.v}`) && !avecImp.has(`${c.m}/${c.v}`));
  console.log("combos qualifies, non declares, SANS impression aout :", cible.length);
  // tirage aleatoire reproductible
  let seed = 42; const rnd = () => (seed = (seed*1103515245+12345) % 2147483648) / 2147483648;
  const ech: any[] = []; const vus = new Set<number>();
  while (ech.length < 20) { const i = Math.floor(rnd()*cible.length); if (vus.has(i)) continue; vus.add(i); ech.push(cible[i]); }
  fs.writeFileSync("/tmp/echantillon.json", JSON.stringify(ech));
  for (const c of ech) console.log(`  /${c.m}/${c.v}  (${c.n} pros ouverts)`);
  // distribution du nombre de pros
  const nAll = cible.map(c=>c.n).sort((a,b)=>a-b);
  const q = (p:number)=>nAll[Math.floor(p*nAll.length)];
  console.log(`\npros ouverts par page ciblee : median ${q(.5)}, p25 ${q(.25)}, p75 ${q(.75)}, p95 ${q(.95)}, max ${nAll[nAll.length-1]}`);
  const decl = combos.filter(c => declared.has(`${c.m}/${c.v}`)).map(c=>c.n).sort((a,b)=>a-b);
  console.log(`pros ouverts par page DECLAREE : median ${decl[Math.floor(.5*decl.length)]}, p95 ${decl[Math.floor(.95*decl.length)]}`);
})().catch(e => { console.error(e.message); process.exit(1); });
