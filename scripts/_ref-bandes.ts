import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const pop = new Map<string, number>(); let off = 0;
  while (true) { const { data } = await sb.from("cities").select("slug,population").order("id").range(off, off+999);
    const rows = data||[]; if (!rows.length) break; for (const r of rows as any[]) pop.set(r.slug, Math.max(pop.get(r.slug)||0, r.population||0)); off += rows.length; }
  const combos: any[] = []; let o2 = 0;
  while (true) { const { data } = await (sb as any).rpc("sitemap_listings_page", { p_offset: o2, p_limit: 20000 });
    const rows = (data||[]) as any[]; if (!rows.length) break; combos.push(...rows); o2 += rows.length; if (rows.length<20000) break; }
  const declared = new Set(fs.readFileSync("/tmp/sm2urls.txt","utf8").trim().split("\n"));
  const gsc = JSON.parse(fs.readFileSync("/tmp/gsc-pages-aout.json","utf8"));
  const perf = new Map<string,{i:number;c:number}>();
  for (const r of gsc) perf.set(String(r.keys[0]).replace(/^https:\/\/workwave\.fr\//,"").replace(/\/$/,""), { i:r.impressions||0, c:r.clicks||0 });

  const bandes: [number,number][] = [[0,2000],[2000,5000],[5000,10000],[10000,20000],[20000,32406],[32406,50000],[50000,100000],[100000,1e9]];
  console.log("bande pop            | statut     |  pages | %avec imp | imp/page | clics | clics/page");
  for (const [a,b] of bandes) {
    for (const dec of [true,false]) {
      const sel = combos.filter(c => { const p = pop.get(c.v)||0; return p>=a && p<b && declared.has(`${c.m}/${c.v}`)===dec; });
      if (sel.length < 30) continue;
      let ci=0, cc=0, nimp=0;
      for (const c of sel) { const p = perf.get(`${c.m}/${c.v}`); if (p) { nimp++; ci+=p.i; cc+=p.c; } }
      console.log(`${String(a).padStart(6)}-${String(b>1e8?"+":b).padEnd(7)} | ${(dec?"declare":"NON decl").padEnd(10)} | ${String(sel.length).padStart(6)} | ${(100*nimp/sel.length).toFixed(1).padStart(8)}% | ${(ci/sel.length).toFixed(2).padStart(8)} | ${String(cc).padStart(5)} | ${(cc/sel.length).toFixed(4)}`);
    }
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
