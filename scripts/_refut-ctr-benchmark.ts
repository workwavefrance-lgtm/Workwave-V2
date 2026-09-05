import { google } from "googleapis";
const SITE="https://workwave.fr/", START="2026-08-07", END="2026-09-03";
(async()=>{
  const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
  const sc=google.searchconsole({version:"v1",auth});
  let all:any[]=[];
  for(let s=0;s<125000;s+=25000){
    const r=await sc.searchanalytics.query({siteUrl:SITE,requestBody:{startDate:START,endDate:END,dimensions:["page"],rowLimit:25000,startRow:s}});
    const rows=r.data.rows||[];all.push(...rows);if(rows.length<25000)break;
  }
  const type=(u:string)=>{const p=new URL(u).pathname.split("/").filter(Boolean);
    if(p.length===0)return "home";
    if(p[0]==="artisan")return "fiche pro";
    if(p[0]==="guide-des-prix")return "guide prix";
    if(p[0]==="blog")return "blog";
    if(p[0]==="trouver-des-chantiers"||p[0]==="trouver-des-clients")return "acquisition pro";
    if(p.length===2&&/-\d{2,3}$/.test(p[1]))return "cat x DEPT";
    if(p.length===2)return "cat x VILLE (titre 'mieux notes')";
    if(p.length===1)return "racine metier";
    return "autre";};
  const g:Record<string,any[]>={};
  for(const r of all){const t=type(r.keys[0]);(g[t]=g[t]||[]).push(r);}
  const sum=(a:any[],k:string)=>a.reduce((x,y)=>x+y[k],0);
  console.log("CTR PAR TYPE DE PAGE, UNIQUEMENT position <= 3.5 (28j)\n");
  const out=Object.entries(g).map(([t,arr])=>{const top=arr.filter(r=>r.position<=3.5);
    return {t,pages:top.length,imp:sum(top,"impressions"),cl:sum(top,"clicks")};})
    .filter(x=>x.imp>=50).sort((a,b)=>b.imp-a.imp);
  for(const x of out) console.log(`${x.t.padEnd(35)} ${String(x.imp).padStart(6)} impr ${String(x.cl).padStart(5)} clics  CTR ${(x.cl/x.imp*100).toFixed(2)}%`);
})();
