import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: "2026-08-06", endDate: "2026-09-02", dimensions: [] } });
  const row: any = (r.data.rows || [])[0];
  console.log(`SITE 06/08 -> 02/09 : ${row.clicks} clics, ${row.impressions} impressions, CTR ${(row.ctr*100).toFixed(2)}%, position ${row.position.toFixed(1)}`);
})();
