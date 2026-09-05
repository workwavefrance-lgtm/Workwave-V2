import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const site = "https://workwave.fr/";
  const start = "2026-08-06", end = "2026-09-02";
  for (const type of ["web", "image", "video", "news"]) {
    try {
      const r = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: start, endDate: end, type, dimensions: [] } });
      const row = (r.data.rows || [])[0];
      console.log(`type=${type.padEnd(6)} clics=${row?.clicks ?? 0}  impressions=${row?.impressions ?? 0}  position=${(row?.position ?? 0).toFixed(1)}`);
    } catch (e: any) { console.log(`type=${type} ERREUR ${e.message}`); }
  }
})();
