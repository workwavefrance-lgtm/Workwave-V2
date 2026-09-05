import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  for (const [S,E] of [["2026-08-05","2026-09-01"],["2026-06-01","2026-09-01"]]) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["searchAppearance"], rowLimit: 100 } });
    console.log(`\n=== searchAppearance ${S} -> ${E} ===`);
    const rows = r.data.rows || [];
    if (!rows.length) console.log("  AUCUN type d'apparence enrichie remonte");
    for (const row of rows)
      console.log(`  ${String(row.keys![0]).padEnd(28)} impr=${row.impressions} clics=${row.clicks} CTR=${((row.ctr||0)*100).toFixed(2)}%`);
  }
}
main().catch(e=>console.error("ERR", e.message));
