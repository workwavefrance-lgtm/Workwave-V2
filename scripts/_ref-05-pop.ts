/** REFUTATION 5 : verifier la population annoncee (65 657 listings >=3 pros
 *  rattachables a un slug, 11 827 a >=10) et la visibilite de reference. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth:{persistSession:false, autoRefreshToken:false} });
(async () => {
  const acc: [string,number][] = JSON.parse(fs.readFileSync("/tmp/catville.json","utf8"));
  const { data: cats } = await sb.from("categories").select("id,slug,vertical");
  const btp = new Map<number,string>();
  for (const c of (cats||[]) as any[]) if (["btp","domicile","personne"].includes(c.vertical)) btp.set(c.id, c.slug);
  const villes = new Map<number,string>(); let off=0;
  while (true) { const { data } = await sb.from("cities").select("id,slug").range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length) break; for(const c of r) villes.set(c.id,c.slug); off+=r.length; }
  let n3=0,n10=0; const chem3: string[] = [];
  for (const [k,n] of acc) { const [c,v]=k.split("|").map(Number);
    if (!btp.has(c) || !villes.has(v)) continue;
    if (n>=3) { n3++; chem3.push(`/${btp.get(c)}/${villes.get(v)}`); }
    if (n>=10) n10++; }
  console.log(`listings BTP x commune rattachables a un slug, >=3 pros ouverts : ${n3}`);
  console.log(`                                              >=10 pros ouverts : ${n10}`);

  const auth = new google.auth.GoogleAuth({ scopes:["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version:"v1", auth:(await auth.getClient()) as never });
  const fin=new Date(Date.now()-3*864e5).toISOString().slice(0,10);
  const debut=new Date(Date.now()-31*864e5).toISOString().slice(0,10);
  const perf=new Map<string,{imp:number;clics:number}>(); let start=0;
  while (true) { const { data } = await sc.searchanalytics.query({ siteUrl:"https://workwave.fr/", requestBody:{
      startDate:debut,endDate:fin,dimensions:["page"],rowLimit:25000,startRow:start}});
    const rows=data.rows||[]; if(!rows.length) break;
    for(const r of rows) perf.set(r.keys![0].replace("https://workwave.fr",""),{imp:r.impressions||0,clics:r.clicks||0});
    start+=rows.length; if(rows.length<25000) break; }
  let vues=0, clics=0, imp=0;
  for (const c of chem3) { const p=perf.get(c); if(p){vues++; clics+=p.clics; imp+=p.imp;} }
  console.log(`\nsur ces ${n3} listings >=3 pros :`);
  console.log(`  vus par Google sur 28 j : ${vues} (${(vues/n3*100).toFixed(1)} %)`);
  console.log(`  impressions : ${imp}   clics : ${clics}  -> ${(clics/28).toFixed(1)} clics/jour`);
  console.log(`  clics par page VUE et par jour : ${(clics/28/Math.max(vues,1)).toFixed(5)}`);
})();
