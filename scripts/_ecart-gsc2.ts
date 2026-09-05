import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const win: [string,string][] = [["2026-08-01","2026-08-31"],["2026-07-01","2026-07-31"]];
  for (const [S,E] of win) {
    for (const pref of ["/guide-des-prix/","/trouver-des-chantiers","/trouver-des-clients","/blog/","/barometre","/verifier-artisan","/deposer-projet"]) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate:S, endDate:E, dimensions:["page"], rowLimit:5000,
        dimensionFilterGroups:[{filters:[{dimension:"page",operator:"contains",expression:pref}]}] } });
      const rows = r.data.rows||[];
      const i = rows.reduce((a,b)=>a+(b.impressions||0),0), c = rows.reduce((a,b)=>a+(b.clicks||0),0);
      console.log(`${S}->${E} ${pref.padEnd(24)} : ${String(rows.length).padStart(4)} pages avec impressions | ${String(i).padStart(6)} imp | ${c} clics`);
    }
    console.log("");
  }
  // requetes prix ou nous sommes vus mais pas cliques
  const r2 = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate:"2026-08-01", endDate:"2026-08-31", dimensions:["query"], rowLimit:25000 } });
  const px = (r2.data.rows||[]).filter(r=>/\b(prix|tarif|co[uû]t|devis|combien)\b/i.test(r.keys![0])).sort((a,b)=>(b.impressions||0)-(a.impressions||0)).slice(0,15);
  console.log("=== Top 15 requetes PRIX (aout) ===");
  for (const r of px) console.log(`  pos ${String(Math.round(r.position||0)).padStart(3)} | ${String(r.impressions).padStart(5)} imp | ${r.clicks} clics | ${r.keys![0]}`);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
