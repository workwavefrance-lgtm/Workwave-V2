import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01"; // 28 jours

  // 1) Total site
  const tot = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E } });
  const t = (tot.data.rows || [])[0];
  console.log(`SITE 28j (${S} -> ${E}) : ${t?.clicks} clics, ${t?.impressions} impressions`);

  // 2) Toutes les pages /artisan/ (pagination 25k)
  let clics = 0, imps = 0, pages = 0, start = 0;
  const clicsParPage: number[] = [];
  while (true) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }],
    }});
    const rows = r.data.rows || [];
    if (rows.length === 0) break;
    for (const row of rows) { clics += row.clicks || 0; imps += row.impressions || 0; clicsParPage.push(row.clicks || 0); }
    pages += rows.length;
    start += rows.length;
    if (rows.length < 25000) break;
  }
  console.log(`FICHES /artisan/ 28j : ${pages} pages avec au moins 1 impression`);
  console.log(`  clics = ${clics}   impressions = ${imps}`);
  console.log(`  pages avec >= 1 clic : ${clicsParPage.filter((c) => c > 0).length}`);
  console.log(`  clics/fiche-affichee/jour = ${(clics / pages / 28).toFixed(5)}`);
}
main();
