import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  for (const [label, expr] of [["nettoyage-vitres/sartrouville","/nettoyage-vitres/sartrouville"],["tout /nettoyage-vitres/","/nettoyage-vitres/"]] as const) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: expr }] }] } });
    const rows = r.data.rows||[];
    const i = rows.reduce((s,x)=>s+(x.impressions||0),0), c = rows.reduce((s,x)=>s+(x.clicks||0),0);
    console.log(`${label.padEnd(32)} : ${rows.length} pages | ${i} impr | ${c} clics`);
  }
}
main().catch(e=>console.error(e.message));
