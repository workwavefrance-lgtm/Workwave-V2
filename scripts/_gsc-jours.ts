import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: "2026-08-24", endDate: "2026-09-03", dimensions: ["date"] } });
  for (const row of r.data.rows || []) console.log(`  ${row.keys![0]} : ${row.clicks} clics, ${row.impressions} impressions, position ${(row.position || 0).toFixed(1)}`);
})();
