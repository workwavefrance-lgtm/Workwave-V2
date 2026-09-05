import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  for (const [lab, s, e] of [["28j (06/08 -> 02/09)","2026-08-06","2026-09-02"],["28j precedents (09/07 -> 05/08)","2026-07-09","2026-08-05"]] as any) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate:s, endDate:e,
      dimensions:["page"], rowLimit: 50,
      dimensionFilterGroups:[{filters:[{dimension:"page",operator:"includingRegex",expression:"workwave\\.fr/(pro$|trouver-des-)"}]}] }});
    console.log(`\n### ${lab}`);
    for (const row of (r.data.rows||[]))
      console.log(`   pos ${(row.position||0).toFixed(1).padStart(5)} | ${String(row.impressions).padStart(4)} imp | ${String(row.clicks).padStart(3)} clics | ${(row.keys||[])[0]}`);
  }
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
