import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  for (const [s, e, n] of [["2026-08-05","2026-09-01","p28"],["2026-07-08","2026-08-04","p28prev"],["2026-07-20","2026-07-26","pic"],["2026-08-26","2026-09-01","s7"]]) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: s, endDate: e, type: "web" } });
    const row = (r.data.rows || [])[0];
    console.log(`${n} SANS DIMENSION : ${row.clicks} clics, ${row.impressions} imp, CTR ${(row.ctr*100).toFixed(2)}%, pos ${row.position.toFixed(2)}`);
  }
})();
