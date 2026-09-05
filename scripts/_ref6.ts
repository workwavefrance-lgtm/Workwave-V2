import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { google } from "googleapis";
const sb=getServiceClient(); const OUVERT="etat_admin.is.null,etat_admin.neq.F";
async function main(){
  const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
  const sc=google.searchconsole({version:"v1",auth});
  let all:any[]=[];
  for(let s=0;s<300000;s+=25000){const r=await sc.searchanalytics.query({siteUrl:"https://workwave.fr/",requestBody:{startDate:"2026-08-05",endDate:"2026-09-01",dimensions:["page"],rowLimit:25000,startRow:s}});const rows=r.data.rows||[];all.push(...rows);if(rows.length<25000)break;}
  const listings=all.filter(r=>{const seg=r.keys[0].replace("https://workwave.fr","").split("?")[0].split("/").filter(Boolean);return seg.length===2&&!/-\d{2,3}$/.test(seg[1])&&!/^(artisan|guide-des-prix|blog|ai|en|trouver-des-chantiers|trouver-des-clients)$/.test(seg[0]);});
  const cats:Record<string,number>={}; for(let o=0;;){const{data}=await sb.from("categories").select("id,slug").range(o,o+999);const r=data??[];if(!r.length)break;r.forEach((c:any)=>cats[c.slug]=c.id);o+=r.length;}
  const villes:Record<string,number>={}; for(let o=0;;){const{data}=await sb.from("cities").select("id,slug").range(o,o+999);const r=data??[];if(!r.length)break;r.forEach((c:any)=>{if(villes[c.slug]===undefined)villes[c.slug]=c.id;});o+=r.length;}
  const rows=listings.map(r=>{const seg=r.keys[0].replace("https://workwave.fr","").split("/").filter(Boolean);return{c:cats[seg[0]],v:villes[seg[1]],impr:r.impressions,clics:r.clicks,pos:r.position};}).filter(x=>x.c&&x.v);
  // echantillon uniforme 900
  const cp=[...rows]; const ech:any[]=[]; for(let i=0;i<900&&cp.length;i++)ech.push(cp.splice(Math.floor(Math.random()*cp.length),1)[0]);
  const out:any[]=[]; const K=10;
  for(let i=0;i<ech.length;i+=K){
    const b=await Promise.all(ech.slice(i,i+K).map(async x=>{const{count}=await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",x.c).eq("city_id",x.v).is("deleted_at",null).eq("is_active",true).or(OUVERT);return{...x,n:count??0};}));
    out.push(...b);
  }
  const B=[["0 pro",(n:number)=>n===0],["1-2 pros",(n:number)=>n>=1&&n<=2],["3-9 pros",(n:number)=>n>=3&&n<=9],["10-29 pros",(n:number)=>n>=10&&n<=29],["30+ pros",(n:number)=>n>=30]] as const;
  console.log(`Echantillon ${out.length} pages /[metier]/[ville] avec impressions (05/08 -> 01/09)\n`);
  console.log("nb de pros listes".padEnd(14)+"pages".padStart(7)+"impr".padStart(8)+"clics".padStart(7)+"pos.moy(pond.impr)".padStart(20)+"   CTR");
  for(const [lab,f] of B){
    const g=out.filter(x=>f(x.n)); if(!g.length){console.log(lab.padEnd(14)+"     0");continue;}
    const i=g.reduce((a,b)=>a+b.impr,0),c=g.reduce((a,b)=>a+b.clics,0),pw=g.reduce((a,b)=>a+b.pos*b.impr,0);
    console.log(lab.padEnd(14)+String(g.length).padStart(7)+String(i).padStart(8)+String(c).padStart(7)+(pw/Math.max(i,1)).toFixed(1).padStart(20)+"   "+(100*c/Math.max(i,1)).toFixed(2)+"%");
  }
  // correlation de Spearman entre nb de pros et position
  const v=out.filter(x=>x.n>0);
  const rk=(arr:number[])=>{const idx=arr.map((x,i)=>[x,i]).sort((a,b)=>a[0]-b[0]);const r=new Array(arr.length);idx.forEach(([,i],k)=>r[i as number]=k+1);return r;};
  const rn=rk(v.map(x=>x.n)),rp=rk(v.map(x=>x.pos));
  const m=(a:number[])=>a.reduce((x,y)=>x+y,0)/a.length; const mn=m(rn),mp=m(rp);
  const cov=rn.reduce((a,_,i)=>a+(rn[i]-mn)*(rp[i]-mp),0);
  const sn=Math.sqrt(rn.reduce((a,x)=>a+(x-mn)**2,0)),sp=Math.sqrt(rp.reduce((a,x)=>a+(x-mp)**2,0));
  console.log(`\nCorrelation de Spearman (nb de pros listes) vs (position moyenne), n=${v.length} : rho = ${(cov/(sn*sp)).toFixed(3)}`);
  console.log("  rho negatif = plus de pros -> meilleure position (position plus petite). rho ~ 0 = aucun lien.");
}
main().catch(e=>console.error(e));
