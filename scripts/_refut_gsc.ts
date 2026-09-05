import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const q = async (start: string, end: string) => {
    const r = await sc.searchanalytics.query({
      siteUrl: "https://workwave.fr/",
      requestBody: { startDate: start, endDate: end, dimensions: ["page"], rowLimit: 25000 },
    });
    return r.data.rows || [];
  };
  const rows = await q("2026-08-06", "2026-09-02");
  let cA = 0, iA = 0, nA = 0, cT = 0, iT = 0;
  for (const r of rows) {
    const u = r.keys![0]; const c = r.clicks || 0; const i = r.impressions || 0;
    cT += c; iT += i;
    if (u.includes("/artisan/")) { cA += c; iA += i; nA++; }
  }
  console.log("fenetre 06/08 -> 02/09 (28 j)");
  console.log("TOTAL   :", cT, "clics,", iT, "impressions, sur", rows.length, "pages");
  console.log("/artisan/:", cA, "clics,", iA, "impressions, sur", nA, "pages distinctes");
  console.log("part des clics venant des fiches :", ((cA / cT) * 100).toFixed(2) + " %");
  console.log("part des impressions            :", ((iA / iT) * 100).toFixed(2) + " %");
  console.log("clics/jour venant des fiches    :", (cA / 28).toFixed(1));
})();
