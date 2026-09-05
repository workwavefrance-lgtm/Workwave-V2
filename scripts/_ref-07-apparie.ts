/** L effet "contenu redactionnel" survit-il a l appariement sur la POPULATION
 *  de la commune ? Toute la France, pas seulement le 86. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
function lnfact(n:number){let s=0;for(let i=2;i<=n;i++)s+=Math.log(i);return s;}
function lnhyp(a:number,b:number,c:number,d:number){const n=a+b+c+d;
  return lnfact(a+b)+lnfact(c+d)+lnfact(a+c)+lnfact(b+d)-lnfact(n)-lnfact(a)-lnfact(b)-lnfact(c)-lnfact(d);}
function fisher(a:number,b:number,c:number,d:number){const n=a+b+c+d,r1=a+b,c1=a+c;
  const p0=lnhyp(a,b,c,d);let p=0;const lo=Math.max(0,c1-(n-r1)),hi=Math.min(r1,c1);
  for(let x=lo;x<=hi;x++){const l=lnhyp(x,r1-x,c1-x,n-r1-c1+x);if(l<=p0+1e-9)p+=Math.exp(l);}
  return Math.min(1,p);}
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version:"v1", auth:(await auth.getClient()) as never });
  const fin=new Date(Date.now()-3*864e5).toISOString().slice(0,10), debut=new Date(Date.now()-31*864e5).toISOString().slice(0,10);
  const perf=new Map<string,{imp:number;clics:number}>(); let start=0;
  while(true){const {data}=await sc.searchanalytics.query({siteUrl:"https://workwave.fr/",requestBody:{
    startDate:debut,endDate:fin,dimensions:["page"],rowLimit:25000,startRow:start}});
    const rows=data.rows||[]; if(!rows.length)break;
    for(const r of rows)perf.set(r.keys![0].replace("https://workwave.fr",""),{imp:r.impressions||0,clics:r.clicks||0});
    start+=rows.length; if(rows.length<25000)break;}
  const acc:[string,number][]=JSON.parse(fs.readFileSync("/tmp/ref-catville.json","utf8"));
  const {data:cats}=await sb.from("categories").select("id,slug").in("vertical",["btp","domicile","personne"]);
  const cs=new Map((cats||[]).map((c:any)=>[c.id,c.slug]));
  const vs=new Map<number,{slug:string;pop:number}>(); let off=0;
  while(true){const {data}=await sb.from("cities").select("id,slug,population").range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length)break; for(const c of r)vs.set(c.id,{slug:c.slug,pop:c.population??0}); off+=r.length;}
  const avec=new Set<string>(); off=0;
  while(true){const {data}=await sb.from("seo_pages").select("category_id,city_id")
      .eq("type","metier_ville").not("content","is",null).not("city_id","is",null).range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length)break; for(const s of r)avec.add(`${s.category_id}|${s.city_id}`); off+=r.length;}

  // Toutes tranches 1-2 pros, France entiere, stratifie par population
  const bandes:[string,number,number][]=[["< 500 hab",0,499],["500-1999",500,1999],["2000-4999",2000,4999],["5000-19999",5000,19999],["20000+",20000,1e9]];
  console.log("TRANCHE 1-2 PROS, FRANCE ENTIERE, stratifie par population de la commune\n");
  console.log("bande population   AVEC contenu (vues/total)   SANS contenu (vues/total)   ecart   p(Fisher)");
  let A=0,At=0,S=0,St=0;
  for(const [lab,mn,mx] of bandes){
    let a=0,at=0,s=0,st=0;
    for(const [k,n] of acc){ if(n>2)continue;
      const [c,v]=k.split("|").map(Number); const B=vs.get(v); if(!B||B.pop<mn||B.pop>mx)continue;
      const C=cs.get(c); if(!C)continue;
      const vu=perf.has(`/${C}/${B.slug}`)?1:0;
      if(avec.has(k)){at++;a+=vu;}else{st++;s+=vu;} }
    A+=a;At+=at;S+=s;St+=st;
    const pa=at?a/at*100:0, ps=st?s/st*100:0;
    console.log(`${lab.padEnd(18)} ${String(a).padStart(6)}/${String(at).padEnd(7)} ${pa.toFixed(2).padStart(6)} %  ${String(s).padStart(7)}/${String(st).padEnd(8)} ${ps.toFixed(2).padStart(6)} %  ${at&&st?("x"+(pa/Math.max(ps,0.0001)).toFixed(2)).padStart(7):"   n/a ".padStart(7)}  ${at&&st?fisher(a,at-a,s,st-s).toFixed(4):"n/a"}`);
  }
  console.log(`\nBRUT (non stratifie) : AVEC ${A}/${At} = ${(A/Math.max(At,1)*100).toFixed(2)} %  ·  SANS ${S}/${St} = ${(S/Math.max(St,1)*100).toFixed(2)} %  · x${(A/Math.max(At,1))/(S/Math.max(St,1))>0?((A/Math.max(At,1))/(S/Math.max(St,1))).toFixed(2):"?"}`);
  console.log(`p(Fisher) brut = ${fisher(A,At-A,S,St-S).toFixed(5)}`);
  // Mantel-Haenszel : effet commun apres stratification
  let num=0,den=0;
  for(const [,mn,mx] of bandes){
    let a=0,b=0,c=0,d=0;
    for(const [k,n] of acc){ if(n>2)continue;
      const [ci,v]=k.split("|").map(Number); const B=vs.get(v); if(!B||B.pop<mn||B.pop>mx)continue;
      const C=cs.get(ci); if(!C)continue;
      const vu=perf.has(`/${C}/${B.slug}`)?1:0;
      if(avec.has(k)){ vu?a++:b++; } else { vu?c++:d++; } }
    const N=a+b+c+d; if(!N)continue;
    num+=a*d/N; den+=b*c/N;
  }
  console.log(`\nodds ratio Mantel-Haenszel (apres appariement sur la population) : ${den>0?(num/den).toFixed(2):"n/a"}`);
})();
