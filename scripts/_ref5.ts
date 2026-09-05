import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { google } from "googleapis";
const sb=getServiceClient();
const OUVERT="etat_admin.is.null,etat_admin.neq.F";
async function main(){
  // 1. pages listing avec impressions
  const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
  const sc=google.searchconsole({version:"v1",auth});
  let all:any[]=[];
  for(let s=0;s<300000;s+=25000){const r=await sc.searchanalytics.query({siteUrl:"https://workwave.fr/",requestBody:{startDate:"2026-08-05",endDate:"2026-09-01",dimensions:["page"],rowLimit:25000,startRow:s}});const rows=r.data.rows||[];all.push(...rows);if(rows.length<25000)break;}
  const listings=all.filter(r=>{const p=r.keys[0].replace("https://workwave.fr","").split("?")[0];const seg=p.split("/").filter(Boolean);return seg.length===2&&!/-\d{2,3}$/.test(seg[1])&&!/^(artisan|guide-des-prix|blog|ai|en|trouver-des-chantiers|trouver-des-clients)$/.test(seg[0]);});
  console.log("pages /[metier]/[ville] avec impressions :",listings.length,"| impressions totales :",listings.reduce((a,b)=>a+b.impressions,0));

  // 2. maps slug -> id
  const cats:Record<string,number>={};
  for(let o=0;;){const {data}=await sb.from("categories").select("id,slug").range(o,o+999);const r=data??[];if(!r.length)break;r.forEach((c:any)=>cats[c.slug]=c.id);o+=r.length;}
  const villes:Record<string,number>={};
  for(let o=0;;){const {data}=await sb.from("cities").select("id,slug").range(o,o+999);const r=data??[];if(!r.length)break;r.forEach((c:any)=>{if(villes[c.slug]===undefined)villes[c.slug]=c.id;});o+=r.length;}
  console.log("categories",Object.keys(cats).length,"| communes",Object.keys(villes).length);

  // 3. echantillons : uniforme sur les pages, et PONDERE par impressions
  const parse=(u:string)=>{const seg=u.replace("https://workwave.fr","").split("?")[0].split("/").filter(Boolean);return{c:cats[seg[0]],v:villes[seg[1]],impr:0};};
  const resolvables=listings.map(r=>({...parse(r.keys[0]),impr:r.impressions,url:r.keys[0]})).filter(x=>x.c&&x.v);
  console.log("pages resolues en base :",resolvables.length,`(${(100*resolvables.length/listings.length).toFixed(1)}%)`);

  const N=500;
  const unif:any[]=[]; const cp=[...resolvables];
  for(let i=0;i<N&&cp.length;i++)unif.push(cp.splice(Math.floor(Math.random()*cp.length),1)[0]);
  const totI=resolvables.reduce((a,b)=>a+b.impr,0); const pond:any[]=[];
  for(let i=0;i<N;i++){let t=Math.random()*totI;for(const r of resolvables){t-=r.impr;if(t<=0){pond.push(r);break;}}}

  async function compte(ech:any[],label:string){
    const res:number[]=[]; const K=10;
    for(let i=0;i<ech.length;i+=K){
      const b=await Promise.all(ech.slice(i,i+K).map(async x=>{
        const {count}=await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",x.c).eq("city_id",x.v).is("deleted_at",null).eq("is_active",true).or(OUVERT);
        return count??0;}));
      res.push(...b);
    }
    const pc=(f:(n:number)=>boolean)=>`${res.filter(f).length} (${(100*res.filter(f).length/res.length).toFixed(1)}%)`;
    console.log(`\n--- ${label} (n=${res.length}) ---`);
    console.log("  0 pro          :",pc(n=>n===0));
    console.log("  1 ou 2 pros    :",pc(n=>n>=1&&n<=2));
    console.log("  3 a 9 pros     :",pc(n=>n>=3&&n<=9));
    console.log("  >=10 pros      :",pc(n=>n>=10));
    console.log("  mediane :",res.slice().sort((a,b)=>a-b)[Math.floor(res.length/2)],"| moyenne :",(res.reduce((a,b)=>a+b,0)/res.length).toFixed(1));
  }
  await compte(unif,"Echantillon UNIFORME sur les pages qui ont des impressions");
  await compte(pond,"Echantillon PONDERE PAR IMPRESSIONS (= ce que Google montre reellement)");
}
main().catch(e=>console.error(e));
