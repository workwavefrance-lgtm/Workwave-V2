import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({
    siteUrl: "https://workwave.fr/",
    requestBody: { startDate: "2026-08-06", endDate: "2026-09-02", dimensions: ["date"] },
  });
  let c = 0, i = 0;
  for (const x of r.data.rows || []) { c += x.clicks || 0; i += x.impressions || 0; }
  console.log("TOTAL SITE non tronque 06/08->02/09 :", c, "clics,", i, "impressions");
  console.log("clics/jour moyen :", (c / 28).toFixed(1));
  const f = await sc.searchanalytics.query({
    siteUrl: "https://workwave.fr/",
    requestBody: { startDate: "2026-08-06", endDate: "2026-09-02", dimensions: ["date"],
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }] },
  });
  let c2 = 0, i2 = 0;
  for (const x of f.data.rows || []) { c2 += x.clicks || 0; i2 += x.impressions || 0; }
  console.log("TOTAL /artisan/ non tronque      :", c2, "clics,", i2, "impressions");
  console.log("=> les 25000 lignes couvraient    :", ((8395 / c2) * 100).toFixed(1), "% des clics fiches");
})();
