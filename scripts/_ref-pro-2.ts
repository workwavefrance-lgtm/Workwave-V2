import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-06-04", E = "2026-09-02";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let all: any[] = [];
  for (let start = 0; start < 100000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
  }
  const impQ = all.reduce((a,x)=>a+(x.impressions||0),0), clkQ = all.reduce((a,x)=>a+(x.clicks||0),0);
  console.log(`SOMME des lignes dimension=query : ${all.length} requetes | ${impQ} imp | ${clkQ} clics`);
  console.log(`(le script de l audit divise par 324072 en dur)`);
  // Requetes qui amenent sur /pro et /trouver-des-*
  for (const expr of ["/trouver-des-chantiers","/trouver-des-clients"]) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 50,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: expr }] }] }});
    console.log(`\nRequetes -> ${expr}`);
    for (const row of (r.data.rows||[]).slice(0,25)) console.log(`   pos ${(row.position||0).toFixed(1).padStart(5)} | ${String(row.impressions).padStart(4)} imp | ${String(row.clicks).padStart(2)} clics | ${row.keys[0]}`);
  }
  // requetes sur la page /pro exacte
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 50,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "equals", expression: "https://workwave.fr/pro" }] }] }});
  console.log(`\nRequetes -> /pro (exact)`);
  for (const row of (r.data.rows||[]).slice(0,25)) console.log(`   pos ${(row.position||0).toFixed(1).padStart(5)} | ${String(row.impressions).padStart(4)} imp | ${String(row.clicks).padStart(2)} clics | ${row.keys[0]}`);
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
