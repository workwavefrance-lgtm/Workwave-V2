import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-06-04", E = "2026-09-02";
async function q(sc:any, body:any){ const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: body }); return r.data.rows||[]; }
async function main(){
  const auth = new google.auth.GoogleAuth({ scopes:["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version:"v1", auth });
  for (const [nom,expr] of [["/trouver-des-chantiers","/trouver-des-chantiers"],["/trouver-des-clients","/trouver-des-clients"]]) {
    const rows = await q(sc,{ startDate:S,endDate:E,dimensions:["page"],rowLimit:1000,
      dimensionFilterGroups:[{filters:[{dimension:"page",operator:"contains",expression:expr}]}]});
    const imp = rows.reduce((a:number,x:any)=>a+(x.impressions||0),0), clk = rows.reduce((a:number,x:any)=>a+(x.clicks||0),0);
    console.log(`\n=== ${nom} (deja en prod, deja en "langage artisan") ===`);
    console.log(`    pages avec >=1 impression : ${rows.length}`);
    console.log(`    ${imp} impressions, ${clk} clics sur 3 mois`);
    for (const r of rows.sort((a:any,b:any)=>(b.impressions||0)-(a.impressions||0)).slice(0,8))
      console.log(`      pos ${(r.position||0).toFixed(1).padStart(5)} | ${String(r.impressions).padStart(4)} imp | ${r.clicks} clics | ${r.keys[0].replace("https://workwave.fr","")}`);
  }
}
main().catch(e=>{console.error("ERR",e.response?.data?.error?.message??e.message);process.exit(1);});
