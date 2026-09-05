import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  for (const [pref,S,E] of [["/trouver-des-clients","2026-08-01","2026-08-31"],["/trouver-des-chantiers","2026-08-01","2026-08-31"],["/trouver-des-chantiers","2026-06-04","2026-06-30"]] as [string,string,string][]) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate:S, endDate:E, dimensions:["query"], rowLimit:1000,
      dimensionFilterGroups:[{filters:[{dimension:"page",operator:"contains",expression:pref}]}] } });
    console.log(`=== ${pref} ${S}->${E} : requetes ===`);
    for (const x of (r.data.rows||[]).sort((a,b)=>(b.impressions||0)-(a.impressions||0)))
      console.log(`  pos ${String(Math.round(x.position||0)).padStart(3)} | ${String(x.impressions).padStart(4)} imp | ${x.clicks} clics | ${x.keys![0]}`);
    console.log("");
  }
}
main().catch(e=>{console.error(e.message);process.exit(1);});
