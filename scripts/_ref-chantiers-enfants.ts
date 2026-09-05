import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const q = async (b:any) => ((await sc.searchanalytics.query({ siteUrl: SITE, requestBody: b })).data.rows || []);

  console.log("=== ENFANTS /trouver-des-chantiers/* qui ont recu des impressions (04/06 -> 02/09) ===");
  const rows = await q({ startDate:"2026-06-04", endDate:"2026-09-02", dimensions:["page"], rowLimit:500,
    dimensionFilterGroups:[{filters:[{dimension:"page",operator:"contains",expression:"/trouver-des-chantiers/"}]}]});
  console.log(`  ${rows.length} pages enfants avec >=1 impression`);
  for (const r of rows) console.log(`   pos ${(r.position||0).toFixed(1).padStart(6)} | ${String(r.impressions).padStart(4)} imp | ${r.clicks} clics | ${(r.keys||[])[0]?.replace("https://workwave.fr","")}`);

  console.log("\n=== HUB : fenetres glissantes recentes (URL exacte) ===");
  const pf = {filters:[{dimension:"page",operator:"equals",expression:"https://workwave.fr/trouver-des-chantiers"}]};
  for (const [s,e] of [["2026-08-03","2026-09-02"],["2026-08-10","2026-09-08"],["2026-08-15","2026-09-13"],["2026-08-20","2026-09-18"]] as const) {
    const r = await q({ startDate:s, endDate:e, dimensions:["page"], rowLimit:5, dimensionFilterGroups:[pf]});
    if (r.length) console.log(`  ${s}->${e} : ${r[0].impressions} imp, ${r[0].clicks} clics, pos ${(r[0].position||0).toFixed(1)}`);
    else console.log(`  ${s}->${e} : aucune ligne`);
  }

  console.log("\n=== HUB : clics totaux depuis le 04/06 ===");
  const tot = await q({ startDate:"2026-06-04", endDate:"2026-09-02", dimensions:["page"], rowLimit:5, dimensionFilterGroups:[pf]});
  for (const r of tot) console.log(`  90 jours : ${r.impressions} imp, ${r.clicks} clics, pos ${(r.position||0).toFixed(1)}, CTR ${((r.ctr||0)*100).toFixed(2)}%`);

  console.log("\n=== Comparaison : /pro (meme parcours) sur les 3 memes fenetres ===");
  const pf2 = {filters:[{dimension:"page",operator:"equals",expression:"https://workwave.fr/pro"}]};
  for (const [s,e] of [["2026-06-04","2026-07-03"],["2026-07-04","2026-08-02"],["2026-08-03","2026-09-02"]] as const) {
    const r = await q({ startDate:s, endDate:e, dimensions:["page"], rowLimit:5, dimensionFilterGroups:[pf2]});
    if (r.length) console.log(`  ${s}->${e} : ${r[0].impressions} imp, ${r[0].clicks} clics, pos ${(r[0].position||0).toFixed(1)}`);
  }
}
main().catch(e=>{console.error("ERR", e.response?.data?.error?.message ?? e.message);process.exit(1);});
