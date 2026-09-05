/** MESURE 20 : bases de chiffrage. Visibilite actuelle par tranche de taille
 *  de listing, et rendement en clics par page visible. */
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
  const fin = new Date(Date.now() - 3*864e5).toISOString().slice(0,10), debut = new Date(Date.now() - 31*864e5).toISOString().slice(0,10);
  const perf = new Map<string,{imp:number;clics:number}>(); let start = 0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: debut, endDate: fin, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = data.rows || []; if (!rows.length) break;
    for (const r of rows) perf.set(r.keys![0].replace("https://workwave.fr",""), { imp: r.impressions||0, clics: r.clicks||0 });
    start += rows.length; if (rows.length < 25000) break;
  }
  const acc: [string,number][] = JSON.parse(fs.readFileSync("/tmp/catville.json","utf8"));
  const { data: cats } = await sb.from("categories").select("id,slug").in("vertical",["btp","domicile","personne"]);
  const cs = new Map((cats||[]).map((c:any)=>[c.id,c.slug]));
  const vs = new Map<number,string>(); let off=0;
  while(true){const {data}=await sb.from("cities").select("id,slug").range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length)break; for(const c of r)vs.set(c.id,c.slug); off+=r.length;}
  const tr = [["1 pro",1,1],["2 pros",2,2],["3-9 pros",3,9],["10+ pros",10,1e9]] as const;
  console.log("tranche      pages servies   visibles Google   part    impressions   clics   clics/jour/page visible");
  for (const [lab,mn,mx] of tr) {
    let t=0,v=0,i=0,c=0;
    for (const [k,n] of acc) { if (n<mn||n>mx) continue; const [a,b]=k.split("|").map(Number);
      const A=cs.get(a),B=vs.get(b); if(!A||!B) continue; t++;
      const p=perf.get(`/${A}/${B}`); if(p){v++;i+=p.imp;c+=p.clics;} }
    console.log(`${lab.padEnd(12)} ${String(t).padStart(11)} ${String(v).padStart(16)} ${((v/Math.max(t,1))*100).toFixed(1).padStart(7)} % ${String(i).padStart(12)} ${String(c).padStart(7)}   ${(c/28/Math.max(v,1)).toFixed(4)}`);
  }
  // fiches
  let fv=0,fi=0,fc=0;
  for (const [u,p] of perf) if (u.startsWith("/artisan/")) { fv++; fi+=p.imp; fc+=p.clics; }
  console.log(`\nfiches /artisan/ : ${fv} visibles sur 2 439 976 servies (${((fv/2439976)*100).toFixed(2)} %) · ${fi} impressions · ${fc} clics · ${(fc/28/fv).toFixed(4)} clic/jour/page visible`);
  console.log(`listings cat x ville avec >=3 pros ouverts : ${acc.filter(([,n])=>n>=3).length} · declares au sitemap : 8235 (mesure curl /sitemap/2.xml)`);
})();
