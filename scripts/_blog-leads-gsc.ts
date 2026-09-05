import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: "2026-06-04", endDate: "2026-09-02", dimensions: ["page"], rowLimit: 100,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "obtenir-leads-artisan" }] }] }});
  const rows = r.data.rows || [];
  console.log(`=== 13 articles "obtenir des leads artisan" : ${rows.length} ont eu >=1 impression ===`);
  let i=0,c=0;
  for (const row of rows) { i+=row.impressions||0; c+=row.clicks||0;
    console.log(`   pos ${(row.position||0).toFixed(1).padStart(5)} | ${String(row.impressions).padStart(4)} imp | ${String(row.clicks).padStart(3)} clics | ${(row.keys||[])[0]?.replace("https://workwave.fr","")}`); }
  console.log(`   TOTAL : ${i} impressions, ${c} clics`);
  // requetes associees
  const q = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: "2026-06-04", endDate: "2026-09-02", dimensions: ["query"], rowLimit: 50,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "obtenir-leads-artisan" }] }] }});
  console.log(`\n=== requetes qui declenchent ces articles ===`);
  for (const row of (q.data.rows||[])) console.log(`   pos ${(row.position||0).toFixed(1).padStart(5)} | ${String(row.impressions).padStart(4)} imp | ${String(row.clicks).padStart(3)} clics | ${row.keys?.[0]}`);
  if (!(q.data.rows||[]).length) console.log("   (aucune)");
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); });
