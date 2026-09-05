import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-06-04", E = "2026-09-02";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  // 1. total site sur la fenetre
  const tot = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E } });
  const t = (tot.data.rows||[])[0];
  console.log(`TOTAL SITE ${S} -> ${E} : ${t?.impressions} imp | ${t?.clicks} clics`);
  // 2. pages pro
  for (const [lab, expr] of [["/trouver-des-chantiers","/trouver-des-chantiers"],["/trouver-des-clients","/trouver-des-clients"],["/pro","workwave.fr/pro"]] as const) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 500,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: expr }] }] }});
    const rows = r.data.rows||[];
    const imp = rows.reduce((a,x)=>a+(x.impressions||0),0), clk = rows.reduce((a,x)=>a+(x.clicks||0),0);
    console.log(`\n${lab} : ${rows.length} pages avec >=1 impression | ${imp} imp | ${clk} clics`);
    for (const row of rows.slice(0,20)) console.log(`   pos ${(row.position||0).toFixed(1).padStart(5)} | ${String(row.impressions).padStart(5)} imp | ${String(row.clicks).padStart(3)} clics | ${(row.keys||[])[0].replace("https://workwave.fr","")}`);
  }
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
