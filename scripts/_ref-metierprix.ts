import { google } from "googleapis";
const SITE="https://workwave.fr/";
const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
const sc=google.searchconsole({version:"v1",auth});
const q=async(b:any)=>((await sc.searchanalytics.query({siteUrl:SITE,requestBody:b})).data.rows||[]);
const A=(rows:any[],l:string)=>{const i=rows.reduce((a,b)=>a+(b.impressions||0),0),c=rows.reduce((a,b)=>a+(b.clicks||0),0);
  const p=i?rows.reduce((a,b)=>a+(b.position||0)*(b.impressions||0),0)/i:0;
  console.log(`${l.padEnd(40)} pages=${String(rows.length).padStart(4)} imp=${String(i).padStart(6)} clics=${String(c).padStart(4)} pos=${p.toFixed(1)}`);return{i,c,n:rows.length};};
(async()=>{
  for(const [S,E,lab] of [["2026-08-01","2026-08-31","aout"],["2026-07-01","2026-07-31","juillet"]] as any){
    // pages /{metier}/prix : filtre regex sur fin d URL
    const r = await q({startDate:S,endDate:E,dimensions:["page"],rowLimit:25000,
      dimensionFilterGroups:[{filters:[{dimension:"page",operator:"includingRegex",expression:"/[a-z0-9-]+/prix/?$"}]}]});
    A(r, `  ${lab}  /{metier}/prix`);
    for(const x of r.slice(0,8)) console.log(`      ${String(x.impressions).padStart(5)} imp | ${x.clicks} clics | pos ${(x.position||0).toFixed(0)} | ${x.keys![0].replace("https://workwave.fr","")}`);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
