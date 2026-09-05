import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: "2026-08-19", endDate: "2026-09-02", dimensions: ["date"], type: "web" } });
  for (const row of r.data.rows || []) console.log(`  ${row.keys![0]} : ${String(row.clicks).padStart(4)} clics | ${String(row.impressions).padStart(6)} imp | CTR ${((row.ctr||0)*100).toFixed(2)}% | pos ${(row.position||0).toFixed(1)}`);
})();
