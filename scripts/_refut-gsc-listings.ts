import { google } from "googleapis";
const RE_LISTING = /^https:\/\/workwave\.fr\/[a-z0-9-]+\/[a-z0-9-]+\/?$/i;
const EXCLUS = /\/(artisan|blog|guide-des-prix|trouver-des-chantiers|trouver-des-clients|ai|en|barometre|pro)\//i;
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({
    siteUrl: "https://workwave.fr/",
    requestBody: { startDate: "2026-08-06", endDate: "2026-09-02", dimensions: ["page"], rowLimit: 25000 },
  });
  const rows = r.data.rows || [];
  let tC = 0, tI = 0, lC = 0, lI = 0, lN = 0;
  for (const row of rows) {
    const u = row.keys![0]; tC += row.clicks || 0; tI += row.impressions || 0;
    if (RE_LISTING.test(u) && !EXCLUS.test(u)) { lC += row.clicks || 0; lI += row.impressions || 0; lN++; }
  }
  console.log(`fenetre 28 j (06/08 -> 02/09), ${rows.length} pages remontees`);
  console.log(`TOUT le site        : ${tC} clics · ${tI} impressions · ${(tC / 28).toFixed(1)} clics/jour`);
  console.log(`pages listing 2 seg : ${lC} clics · ${lI} impressions · ${(lC / 28).toFixed(1)} clics/jour · ${lN} pages`);
  console.log(`CTR listings        : ${((lC / Math.max(lI, 1)) * 100).toFixed(2)} %`);
  console.log(`part des clics site : ${((lC / Math.max(tC, 1)) * 100).toFixed(1)} %`);
})();
