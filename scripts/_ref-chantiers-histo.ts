import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const pf = {filters:[{dimension:"page",operator:"equals",expression:"https://workwave.fr/trouver-des-chantiers"}]};
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const q = async (b:any) => ((await sc.searchanalytics.query({ siteUrl: SITE, requestBody: b })).data.rows || []);

  console.log("=== HUB : tout l historique disponible (16 mois) ===");
  const t = await q({startDate:"2025-05-01", endDate:"2026-09-03", dimensions:["page"], rowLimit:5, dimensionFilterGroups:[pf]});
  for (const r of t) console.log(`  ${r.impressions} imp, ${r.clicks} CLICS, pos ${(r.position||0).toFixed(1)}`);

  console.log("\n=== HUB : toutes les requetes de l historique, triees ===");
  const rq = await q({startDate:"2025-05-01", endDate:"2026-09-03", dimensions:["query"], rowLimit:200, dimensionFilterGroups:[pf]});
  for (const r of rq) console.log(`  pos ${(r.position||0).toFixed(1).padStart(6)} | ${String(r.impressions).padStart(4)} imp | ${r.clicks} clics | ${(r.keys||[])[0]}`);

  console.log("\n=== Part des impressions couvertes par la dimension query (biais GSC) ===");
  for (const [s,e] of [["2026-06-04","2026-07-03"],["2026-08-03","2026-09-02"]] as const) {
    const p = await q({startDate:s,endDate:e,dimensions:["page"],rowLimit:5,dimensionFilterGroups:[pf]});
    const g = await q({startDate:s,endDate:e,dimensions:["query"],rowLimit:200,dimensionFilterGroups:[pf]});
    const sumq = g.reduce((a,x)=>a+(x.impressions||0),0);
    console.log(`  ${s}->${e} : page=${p[0]?.impressions} imp | somme des requetes=${sumq} imp | couverture ${((sumq/(p[0]?.impressions||1))*100).toFixed(0)}%`);
  }
})().catch(e=>{console.error("ERR", e.response?.data?.error?.message ?? e.message);process.exit(1);});
