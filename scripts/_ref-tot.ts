import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  const t = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E } });
  console.log("TOTAL SITE 05/08-01/09 :", JSON.stringify(t.data.rows?.[0]));
  const f = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }] } });
  console.log("TOTAL FICHES /artisan/ :", JSON.stringify(f.data.rows?.[0]));
  const p = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/plombier/" }] }] } });
  console.log("TOTAL pages /plombier/ :", JSON.stringify(p.data.rows?.[0]));
})();
