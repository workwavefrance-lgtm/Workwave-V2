/** RE-MESURE de l A/B du dept 86 + bases de chiffrage + test statistique. */
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
  const fin = new Date(Date.now() - 3*864e5).toISOString().slice(0,10);
  const debut = new Date(Date.now() - 31*864e5).toISOString().slice(0,10);
  const perf = new Map<string,{imp:number;clics:number;pos:number}>(); let start = 0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: debut, endDate: fin, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = data.rows || []; if (!rows.length) break;
    for (const r of rows) perf.set(r.keys![0].replace("https://workwave.fr",""), { imp: r.impressions||0, clics: r.clicks||0, pos: r.position||0 });
    start += rows.length; if (rows.length < 25000) break;
  }
  console.log(`fenetre GSC ${debut} -> ${fin} ; pages avec >=1 impression : ${perf.size}\n`);

  const acc: [string,number][] = JSON.parse(fs.readFileSync("/tmp/ref-catville.json","utf8"));
  const { data: cats } = await sb.from("categories").select("id,slug").in("vertical",["btp","domicile","personne"]);
  const cs = new Map((cats||[]).map((c:any)=>[c.id,c.slug]));
  const vs = new Map<number,{slug:string;dept:number;pop:number|null}>(); let off=0;
  while(true){const {data}=await sb.from("cities").select("id,slug,department_id,population").range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length)break; for(const c of r)vs.set(c.id,{slug:c.slug,dept:c.department_id,pop:c.population}); off+=r.length;}
  console.log(`categories BTP/domicile/personne : ${cs.size} · communes : ${vs.size}`);

  // ---- BASES DE CHIFFRAGE par tranche ----
  console.log("\ntranche      couples    rattachables   visibles   part      impressions  clics  clics/j/page visible");
  for (const [lab,mn,mx] of [["1 pro",1,1],["2 pros",2,2],["1-2 pros",1,2],["3-9 pros",3,9],["10+ pros",10,1e9]] as const) {
    let tot=0,rat=0,v=0,i=0,c=0;
    for (const [k,n] of acc) { if(n<mn||n>mx) continue; tot++;
      const [a,b]=k.split("|").map(Number); const A=cs.get(a),B=vs.get(b); if(!A||!B) continue; rat++;
      const p=perf.get(`/${A}/${B.slug}`); if(p){v++;i+=p.imp;c+=p.clics;} }
    console.log(`${lab.padEnd(12)} ${String(tot).padStart(8)} ${String(rat).padStart(14)} ${String(v).padStart(10)} ${((v/Math.max(rat,1))*100).toFixed(2).padStart(6)} % ${String(i).padStart(12)} ${String(c).padStart(6)}   ${(c/28/Math.max(v,1)).toFixed(4)}`);
  }

  // ---- A/B 86 ----
  const { data: d86 } = await sb.from("departments").select("id").eq("code","86").limit(1);
  const dept86 = d86![0].id;
  const avecContenu = new Set<string>(); off=0;
  while (true) { const { data } = await sb.from("seo_pages").select("category_id,city_id")
      .eq("type","metier_ville").not("content","is",null).not("city_id","is",null).range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length)break; for(const s of r)avecContenu.add(`${s.category_id}|${s.city_id}`); off+=r.length; }
  console.log(`\ncouples avec seo_pages.content : ${avecContenu.size}`);

  for (const [lab,mn,mx] of [["1-2 pros",1,2],["3-9 pros",3,9],["10+ pros",10,1e9]] as const) {
    const r:Record<string,{t:number;v:number;pops:number[];imp:number;clics:number}> =
      {AVEC:{t:0,v:0,pops:[],imp:0,clics:0},SANS:{t:0,v:0,pops:[],imp:0,clics:0}};
    for (const [k,n] of acc) {
      const [a,b]=k.split("|").map(Number); const B=vs.get(b);
      if(!B||B.dept!==dept86||n<mn||n>mx) continue;
      const A=cs.get(a); if(!A) continue;
      const g = avecContenu.has(k)?"AVEC":"SANS";
      r[g].t++; r[g].pops.push(B.pop??0);
      const p=perf.get(`/${A}/${B.slug}`); if(p){r[g].v++;r[g].imp+=p.imp;r[g].clics+=p.clics;}
    }
    const med=(x:number[])=>{const s=[...x].sort((p,q)=>p-q);return s.length?s[Math.floor(s.length/2)]:0;};
    console.log(`\n${lab} (dept 86)`);
    for (const g of ["AVEC","SANS"] as const)
      console.log(`  ${g} contenu : ${r[g].v}/${r[g].t} vues (${((r[g].v/Math.max(r[g].t,1))*100).toFixed(2)} %) · pop mediane commune ${med(r[g].pops)} · pop moyenne ${(r[g].pops.reduce((s,x)=>s+x,0)/Math.max(r[g].pops.length,1)).toFixed(0)} · ${r[g].imp} imp · ${r[g].clics} clics`);
    // Fisher exact bilateral
    const a=r.AVEC.v,b=r.AVEC.t-r.AVEC.v,c2=r.SANS.v,d=r.SANS.t-r.SANS.v;
    console.log(`  table 2x2 : [${a},${b};${c2},${d}]  p(Fisher bilateral) = ${fisher(a,b,c2,d).toFixed(4)}`);
  }
})();
function lnfact(n:number){let s=0;for(let i=2;i<=n;i++)s+=Math.log(i);return s;}
function lnhyp(a:number,b:number,c:number,d:number){
  const n=a+b+c+d;
  return lnfact(a+b)+lnfact(c+d)+lnfact(a+c)+lnfact(b+d)-lnfact(n)-lnfact(a)-lnfact(b)-lnfact(c)-lnfact(d);
}
function fisher(a:number,b:number,c:number,d:number){
  const n=a+b+c+d,r1=a+b,c1=a+c;
  const p0=lnhyp(a,b,c,d); let p=0;
  const lo=Math.max(0,c1-(n-r1)),hi=Math.min(r1,c1);
  for(let x=lo;x<=hi;x++){const l=lnhyp(x,r1-x,c1-x,n-r1-c1+x);
    if(l<=p0+1e-9)p+=Math.exp(l);}
  return Math.min(1,p);
}
