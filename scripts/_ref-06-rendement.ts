/** Le rendement 0,0040 clic/j/page visible est-il applicable aux pages MARGINALES ?
 *  Concentration des clics dans le segment 1-2 pros. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const fin = new Date(Date.now()-3*864e5).toISOString().slice(0,10), debut = new Date(Date.now()-31*864e5).toISOString().slice(0,10);
  const perf = new Map<string,{imp:number;clics:number;pos:number}>(); let start=0;
  while(true){const {data}=await sc.searchanalytics.query({siteUrl:"https://workwave.fr/",requestBody:{
    startDate:debut,endDate:fin,dimensions:["page"],rowLimit:25000,startRow:start}});
    const rows=data.rows||[]; if(!rows.length)break;
    for(const r of rows)perf.set(r.keys![0].replace("https://workwave.fr",""),{imp:r.impressions||0,clics:r.clicks||0,pos:r.position||0});
    start+=rows.length; if(rows.length<25000)break;}
  const acc:[string,number][]=JSON.parse(fs.readFileSync("/tmp/ref-catville.json","utf8"));
  const {data:cats}=await sb.from("categories").select("id,slug").in("vertical",["btp","domicile","personne"]);
  const cs=new Map((cats||[]).map((c:any)=>[c.id,c.slug]));
  const vs=new Map<number,string>(); let off=0;
  while(true){const {data}=await sb.from("cities").select("id,slug").range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length)break; for(const c of r)vs.set(c.id,c.slug); off+=r.length;}
  const pages:{imp:number;clics:number;pos:number}[]=[];
  for(const [k,n] of acc){ if(n>2)continue; const [a,b]=k.split("|").map(Number);
    const A=cs.get(a),B=vs.get(b); if(!A||!B)continue; const p=perf.get(`/${A}/${B}`); if(p)pages.push(p); }
  pages.sort((x,y)=>y.imp-x.imp);
  const tot=pages.reduce((s,p)=>s+p.clics,0), totImp=pages.reduce((s,p)=>s+p.imp,0);
  console.log(`segment 1-2 pros : ${pages.length} pages visibles · ${totImp} impressions · ${tot} clics sur 28 j (${(tot/28).toFixed(1)} clics/jour)\n`);
  const dec=Math.ceil(pages.length/10);
  console.log("decile (par impressions)  pages   impressions   clics   clics/jour/page");
  for(let i=0;i<10;i++){
    const t=pages.slice(i*dec,(i+1)*dec);
    const im=t.reduce((s,p)=>s+p.imp,0), cl=t.reduce((s,p)=>s+p.clics,0);
    console.log(`  D${i+1} ${i===0?"(les mieux vues)":i===9?"(les moins vues)":"               "} ${String(t.length).padStart(5)} ${String(im).padStart(12)} ${String(cl).padStart(7)}   ${(cl/28/Math.max(t.length,1)).toFixed(5)}`);
  }
  const bas=pages.slice(dec*5);
  console.log(`\nmoitie basse (${bas.length} pages) : ${bas.reduce((s,p)=>s+p.imp,0)} impressions · ${bas.reduce((s,p)=>s+p.clics,0)} clics · ${(bas.reduce((s,p)=>s+p.clics,0)/28/bas.length).toFixed(5)} clic/jour/page`);
  const pos=pages.reduce((s,p)=>s+p.pos*p.imp,0)/Math.max(totImp,1);
  console.log(`position moyenne ponderee du segment : ${pos.toFixed(1)}`);
})();
