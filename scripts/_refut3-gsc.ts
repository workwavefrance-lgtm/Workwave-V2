import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-07", E = "2026-09-03";
  // Toutes les pages /plombier/ , triees par impressions
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: S, endDate: E, dimensions: ["page"], rowLimit: 500,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/plombier/" }] }] } });
  const rows = (r.data.rows||[]);
  console.log(`=== pages /plombier/ sur 28j (${S} -> ${E}) : ${rows.length} pages ===`);
  let ti=0, tc=0;
  for (const row of rows) { ti += row.impressions||0; tc += row.clicks||0; }
  console.log(`TOTAL toutes pages /plombier/ : ${ti} impressions, ${tc} clics`);
  const villes = ["bordeaux","lyon","marseille","toulouse","nantes","montpellier","poitiers","lille","nice","strasbourg","rennes"];
  console.log("\n--- metropoles ciblees par l'audit ---");
  for (const v of villes) {
    const m = rows.filter(x => (x.keys?.[0]||"").endsWith("/plombier/"+v));
    for (const row of m)
      console.log(`  ${v.padEnd(12)} pos ${(row.position||0).toFixed(1).padStart(5)} | ${String(row.impressions).padStart(5)} imp | ${row.clicks} clics`);
    if (!m.length) console.log(`  ${v.padEnd(12)} (aucune impression)`);
  }
  console.log("\n--- top 12 pages /plombier/ par impressions ---");
  rows.sort((a,b)=>(b.impressions||0)-(a.impressions||0));
  for (const row of rows.slice(0,12))
    console.log(`  pos ${(row.position||0).toFixed(1).padStart(5)} | ${String(row.impressions).padStart(5)} imp | ${String(row.clicks).padStart(3)} clics | ${(row.keys?.[0]||"").replace("https://workwave.fr","")}`);
})().catch(e=>{console.error(e.response?.data?.error?.message ?? e.message);process.exit(1);});
