import fs from "fs"; import { google } from "googleapis";
const SITE="https://workwave.fr/";
const rated=new Set<string>(JSON.parse(fs.readFileSync("/tmp/rated_slugs.json","utf8")));
async function main(){
  const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
  const sc=google.searchconsole({version:"v1",auth});
  let all:any[]=[];
  for(let s=0;s<150000;s+=25000){
    const r=await sc.searchanalytics.query({siteUrl:SITE,requestBody:{startDate:"2026-08-05",endDate:"2026-09-01",dimensions:["page"],rowLimit:25000,startRow:s}});
    const rows=r.data.rows||[]; all.push(...rows); if(rows.length<25000) break;
  }
  const bands=[[0,5],[5,10],[10,20],[20,999]];
  const mk=()=>bands.map(()=>({i:0,c:0,n:0}));
  const tb=mk(),ub=mk(); const T={i:0,c:0,n:0,pw:0},U={i:0,c:0,n:0,pw:0};
  for(const r of all){
    const p=String(r.keys![0]).replace("https://workwave.fr","");
    if(!p.startsWith("/artisan/")) continue;
    const slug=p.slice("/artisan/".length).replace(/\/$/,"");
    const isT=rated.has(slug);
    const g=isT?T:U; g.i+=r.impressions||0; g.c+=r.clicks||0; g.n++; g.pw+=(r.position||0)*(r.impressions||0);
    const bi=bands.findIndex(([a,b])=>(r.position||0)>=a&&(r.position||0)<b); if(bi<0)continue;
    const d=isT?tb[bi]:ub[bi]; d.i+=r.impressions||0; d.c+=r.clicks||0; d.n++;
  }
  const f=(x:any)=>x.i?`${((100*x.c)/x.i).toFixed(2)}%  (${x.c} clics / ${x.i} impr, ${x.n} pages)`:"aucune impression";
  console.log("/artisan/[slug], 05/08 -> 01/09  (page = entite unique, seul type eligible aux etoiles)\n");
  console.log("  fiches NOTEES     :",f(T)," pos.moy",(T.pw/Math.max(T.i,1)).toFixed(1));
  console.log("  fiches NON notees :",f(U)," pos.moy",(U.pw/Math.max(U.i,1)).toFixed(1));
  console.log("\nA POSITION COMPARABLE");
  bands.forEach(([a,b],k)=>{
    console.log(`  pos ${a}-${b}`);
    console.log("     NOTEES     :",f(tb[k]));
    console.log("     NON notees :",f(ub[k]));
  });
}
main().catch(e=>console.error(e.message));
