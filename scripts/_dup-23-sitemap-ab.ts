/** MESURE 21 : experience naturelle. Parmi les listings cat x ville a >=3 pros
 *  ouverts, ceux DECLARES au sitemap sont-ils plus visibles que les autres,
 *  a taille comparable ? (le sitemap ne retient que les 300 communes les plus
 *  peuplees : app/sitemap.ts, TOP_CITIES_FOR_LISTINGS = 300) */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const sm = new Set<string>();
  const x = await (await fetch("https://workwave.fr/sitemap/2.xml")).text();
  for (const m of x.match(/<loc>([^<]+)<\/loc>/g) || []) sm.add(m.replace(/<\/?loc>/g,"").replace("https://workwave.fr",""));
  console.log(`URL cat x ville declarees au sitemap : ${sm.size}`);

  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const fin = new Date(Date.now()-3*864e5).toISOString().slice(0,10), debut = new Date(Date.now()-31*864e5).toISOString().slice(0,10);
  const perf = new Map<string,{imp:number;clics:number}>(); let start=0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl:"https://workwave.fr/", requestBody:{
      startDate:debut, endDate:fin, dimensions:["page"], rowLimit:25000, startRow:start } });
    const rows = data.rows||[]; if(!rows.length)break;
    for (const r of rows) perf.set(r.keys![0].replace("https://workwave.fr",""),{imp:r.impressions||0,clics:r.clicks||0});
    start+=rows.length; if(rows.length<25000)break;
  }
  const acc: [string,number][] = JSON.parse(fs.readFileSync("/tmp/catville.json","utf8"));
  const { data: cats } = await sb.from("categories").select("id,slug").in("vertical",["btp","domicile","personne"]);
  const cs = new Map((cats||[]).map((c:any)=>[c.id,c.slug]));
  const vs = new Map<number,string>(); let off=0;
  while(true){const {data}=await sb.from("cities").select("id,slug").range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length)break; for(const c of r)vs.set(c.id,c.slug); off+=r.length;}

  for (const [lab,mn,mx] of [["3-9 pros",3,9],["10+ pros",10,1e9]] as const) {
    const g: Record<string,{t:number;v:number;c:number}> = { "DECLARE au sitemap":{t:0,v:0,c:0}, "NON declare":{t:0,v:0,c:0} };
    for (const [k,n] of acc) { if(n<mn||n>mx) continue; const [a,b]=k.split("|").map(Number);
      const A=cs.get(a),B=vs.get(b); if(!A||!B) continue; const u=`/${A}/${B}`;
      const key = sm.has(u) ? "DECLARE au sitemap" : "NON declare";
      g[key].t++; const p=perf.get(u); if(p){g[key].v++;g[key].c+=p.clics;} }
    console.log(`\n${lab} :`);
    for (const [k,a] of Object.entries(g))
      console.log(`  ${k.padEnd(20)} ${String(a.t).padStart(7)} pages · ${String(a.v).padStart(6)} visibles (${((a.v/Math.max(a.t,1))*100).toFixed(1).padStart(5)} %) · ${a.c} clics/28j`);
  }
})();
