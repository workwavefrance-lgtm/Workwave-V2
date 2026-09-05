import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const communes = new Set<string>(); let cl = 0, im = 0, n = 0;
  for (let start = 0; start < 50000; start += 25000) {
    const r = await sc.searchanalytics.query({
      siteUrl: "https://workwave.fr/",
      requestBody: { startDate: "2026-08-05", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 25000, startRow: start },
    });
    const rows = r.data.rows || [];
    if (!rows.length) break;
    for (const row of rows) {
      const u = (row.keys![0] || "").replace("https://workwave.fr", "");
      const m = u.match(/^\/[a-z0-9-]+\/([a-z0-9-]+)$/);
      if (m && !/-([0-9]{2,3}|wbr|bru|wht|wlg|wlx|wna)$/.test(u)) {
        communes.add(m[1]); cl += row.clicks || 0; im += row.impressions || 0; n++;
      }
    }
    if (rows.length < 25000) break;
  }
  console.log(`Pages metier x commune vues par GSC sur 30j : ${n} URL`);
  console.log(`Communes DISTINCTES deja visibles dans Google : ${communes.size}`);
  console.log(`Clics : ${cl} (${(cl/30).toFixed(1)}/jour) · Impressions : ${im}`);
})();
