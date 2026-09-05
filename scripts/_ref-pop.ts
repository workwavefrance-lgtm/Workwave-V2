import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const pop = new Map<string, number>(); let off = 0;
  while (true) {
    const { data } = await sb.from("cities").select("slug,population").order("id").range(off, off+999);
    const rows = data || []; if (!rows.length) break;
    for (const r of rows as any[]) pop.set(r.slug, Math.max(pop.get(r.slug)||0, r.population||0));
    off += rows.length;
  }
  const combos: any[] = []; let o2 = 0;
  while (true) {
    const { data } = await (sb as any).rpc("sitemap_listings_page", { p_offset: o2, p_limit: 20000 });
    const rows = (data||[]) as any[]; if (!rows.length) break; combos.push(...rows); o2 += rows.length; if (rows.length<20000) break;
  }
  const declared = new Set(fs.readFileSync("/tmp/sm2urls.txt","utf8").trim().split("\n"));
  const gsc = JSON.parse(fs.readFileSync("/tmp/gsc-pages-aout.json","utf8"));
  const avecImp = new Set(gsc.map((r:any)=>String(r.keys[0]).replace(/^https:\/\/workwave\.fr\//,"").replace(/\/$/,"")));
  const grp = (f:(c:any)=>boolean, nom:string) => {
    const p = combos.filter(f).map(c=>pop.get(c.v)||0).sort((a,b)=>a-b);
    if (!p.length) return console.log(nom, "vide");
    const q=(x:number)=>p[Math.floor(x*p.length)];
    const somme = p.reduce((a,b)=>a+b,0);
    console.log(`${nom.padEnd(40)} n=${String(p.length).padStart(6)} | pop mediane ${String(q(.5)).padStart(7)} | moy ${String(Math.round(somme/p.length)).padStart(7)} | somme pop ${somme}`);
  };
  grp(c=>declared.has(`${c.m}/${c.v}`), "combos DECLARES au sitemap");
  grp(c=>!declared.has(`${c.m}/${c.v}`), "combos NON declares");
  grp(c=>!declared.has(`${c.m}/${c.v}`) && avecImp.has(`${c.m}/${c.v}`), "  non declares AVEC impressions");
  grp(c=>!declared.has(`${c.m}/${c.v}`) && !avecImp.has(`${c.m}/${c.v}`), "  non declares SANS impression (cible)");
})().catch(e=>{console.error(e.message);process.exit(1);});
