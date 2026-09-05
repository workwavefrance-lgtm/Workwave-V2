/** REFUTATION : le test A/B du sitemap confond "declare" et "grande ville".
 *  Le sitemap ne retient QUE les 300 communes les plus peuplees (getTopCities
 *  trie par population DESC). On compare donc des bandes de RANG voisines
 *  autour du seuil 300 : si l'effet "sitemap" existe, il doit survivre a
 *  population comparable. */
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
  // toutes les villes avec population, pour reconstituer le RANG exact
  const villes: {id:number;slug:string;pop:number}[] = []; let off=0;
  while(true){const {data}=await sb.from("cities").select("id,slug,population").range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length)break; for(const c of r)villes.push({id:c.id,slug:c.slug,pop:c.population??-1}); off+=r.length;}
  villes.sort((a,b)=>b.pop-a.pop);
  const rang = new Map<number,number>(); villes.forEach((v,i)=>rang.set(v.id,i+1));
  const slugDe = new Map(villes.map(v=>[v.id,v.slug]));
  const popDe  = new Map(villes.map(v=>[v.id,v.pop]));
  console.log(`villes classees : ${villes.length} · population au rang 300 = ${villes[299]?.pop} · au rang 301 = ${villes[300]?.pop} · au rang 500 = ${villes[499]?.pop}`);

  // controle 1 : le sitemap correspond-il bien au top 300 ?
  let dansTop300=0, horsTop300=0;
  for (const u of sm) { const s=u.split("/")[2]; const v=villes.find(v=>v.slug===s);
    if(v && rang.get(v.id)!<=300) dansTop300++; else horsTop300++; }
  console.log(`URL du sitemap dont la commune est dans le top 300 population : ${dansTop300} / ${sm.size} (hors top 300 : ${horsTop300})\n`);

  const bandes: [string,number,number][] = [
    ["rang   1- 50 (declare)",1,50], ["rang  51-150 (declare)",51,150],
    ["rang 151-300 (declare)",151,300],
    ["rang 301-450 (NON decl.)",301,450], ["rang 451-800 (NON decl.)",451,800],
    ["rang 801-2000 (NON decl.)",801,2000],
  ];
  for (const [lab,mn,mx] of [["3-9 pros",3,9],["10+ pros",10,1e9]] as const) {
    console.log(`\n=== ${lab} ===`);
    console.log("bande de rang population        pages  visibles      %   clics/28j  pop.med.");
    for (const [nom,r1,r2] of bandes) {
      let t=0,v=0,c=0; const pops:number[]=[];
      for (const [k,n] of acc) { if(n<mn||n>mx) continue; const [a,b]=k.split("|").map(Number);
        const rg=rang.get(b); if(!rg||rg<r1||rg>r2) continue;
        const A=cs.get(a),B=slugDe.get(b); if(!A||!B) continue;
        t++; pops.push(popDe.get(b)||0);
        const p=perf.get(`/${A}/${B}`); if(p){v++;c+=p.clics;} }
      pops.sort((x,y)=>x-y);
      console.log(`${nom.padEnd(28)} ${String(t).padStart(6)} ${String(v).padStart(9)} ${((v/Math.max(t,1))*100).toFixed(1).padStart(6)} % ${String(c).padStart(9)}   ${String(pops[Math.floor(pops.length/2)]??0).padStart(7)}`);
    }
  }
})();
