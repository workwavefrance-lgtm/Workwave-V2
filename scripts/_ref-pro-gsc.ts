import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const wins: [string,string][] = [
    ["2026-06-04","2026-06-30"],["2026-07-01","2026-07-31"],["2026-08-01","2026-08-31"],
    ["2026-08-25","2026-08-31"],["2026-09-01","2026-09-04"],
  ];
  for (const pref of ["/trouver-des-chantiers","/trouver-des-clients"]) {
    console.log("=== " + pref + " ===");
    for (const [S,E] of wins) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate:S, endDate:E, dimensions:["page"], rowLimit:5000,
        dimensionFilterGroups:[{filters:[{dimension:"page",operator:"contains",expression:pref}]}] } });
      const rows = r.data.rows||[];
      const i = rows.reduce((a,b)=>a+(b.impressions||0),0), c = rows.reduce((a,b)=>a+(b.clicks||0),0);
      const pos = rows.length ? rows.reduce((a,b)=>a+(b.position||0)*(b.impressions||0),0)/Math.max(i,1) : 0;
      console.log(`  ${S}->${E} : ${String(rows.length).padStart(4)} pages | ${String(i).padStart(6)} imp | ${c} clics | pos ${pos.toFixed(1)}`);
      if (rows.length && rows.length<=12) for (const x of rows) console.log(`       ${String(x.impressions).padStart(4)} imp ${x.clicks} clics pos ${Math.round(x.position||0)} ${x.keys![0]}`);
    }
  }
  // requetes d intention pro
  const r2 = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate:"2026-08-01", endDate:"2026-08-31", dimensions:["query"], rowLimit:25000 } });
  const rows = r2.data.rows||[];
  const pro = rows.filter(r=>/chantier|trouver des clients|auto.?entrepreneur|artisan.*(client|chantier)/i.test(r.keys![0]));
  const i = pro.reduce((a,b)=>a+(b.impressions||0),0), c = pro.reduce((a,b)=>a+(b.clicks||0),0);
  console.log(`\n=== requetes intention PRO (aout) : ${pro.length} requetes | ${i} imp | ${c} clics ===`);
  for (const r of pro.sort((a,b)=>(b.impressions||0)-(a.impressions||0)).slice(0,15))
    console.log(`  pos ${String(Math.round(r.position||0)).padStart(3)} | ${String(r.impressions).padStart(4)} imp | ${r.clicks} clics | ${r.keys![0]}`);
  const tot = rows.reduce((a,b)=>a+(b.impressions||0),0), totc = rows.reduce((a,b)=>a+(b.clicks||0),0);
  console.log(`\nTOTAL site aout : ${tot} imp | ${totc} clics (part pro : ${(i/tot*100).toFixed(2)} % des imp)`);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
