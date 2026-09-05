import { google } from "googleapis";
const SITE="https://workwave.fr/";
const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
const sc=google.searchconsole({version:"v1",auth});
const q=async(b:any)=>((await sc.searchanalytics.query({siteUrl:SITE,requestBody:b})).data.rows||[]);
const S=(rows:any[])=>{const i=rows.reduce((a,b)=>a+(b.impressions||0),0),c=rows.reduce((a,b)=>a+(b.clicks||0),0);
  const p=i?rows.reduce((a,b)=>a+(b.position||0)*(b.impressions||0),0)/i:0; return {i,c,p};};
const MOIS:any=[["2026-06-01","2026-06-30","juin"],["2026-07-01","2026-07-31","juillet"],["2026-08-01","2026-08-31","aout"]];
(async()=>{
  console.log("mois     | SITE ENTIER                    | GUIDES /guide-des-prix/       | LISTINGS metier x lieu");
  for(const [a,b,lab] of MOIS){
    const site=S(await q({startDate:a,endDate:b,dimensions:["date"],rowLimit:100}));
    const gd=S(await q({startDate:a,endDate:b,dimensions:["page"],rowLimit:25000,
      dimensionFilterGroups:[{filters:[{dimension:"page",operator:"contains",expression:"/guide-des-prix/"}]}]}));
    // listings = pages a 2 segments hors familles connues
    const li=S(await q({startDate:a,endDate:b,dimensions:["page"],rowLimit:25000,
      dimensionFilterGroups:[{filters:[
        {dimension:"page",operator:"includingRegex",expression:"^https://workwave\\.fr/[a-z0-9-]+/[a-z0-9-]+/?$"},
        {dimension:"page",operator:"excludingRegex",expression:"/(artisan|blog|guide-des-prix|trouver-des-chantiers|trouver-des-clients|ai)/"}]}]}));
    console.log(`${lab.padEnd(8)} | ${String(site.i).padStart(7)} imp ${String(site.c).padStart(5)} cl pos ${site.p.toFixed(1).padStart(5)} | ${String(gd.i).padStart(5)} imp ${String(gd.c).padStart(3)} cl pos ${gd.p.toFixed(1).padStart(5)} | ${String(li.i).padStart(6)} imp ${String(li.c).padStart(4)} cl pos ${li.p.toFixed(1)}`);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
