import { google } from "googleapis";
import fs from "fs";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const rows: any[] = [];
  for (let start = 0; ; start += 25000) {
    const r = await sc.searchanalytics.query({
      siteUrl: "https://workwave.fr/",
      requestBody: { startDate: "2026-08-08", endDate: "2026-09-04", dimensions: ["page"], type: "web", rowLimit: 25000, startRow: start },
    });
    const got = r.data.rows || [];
    rows.push(...got);
    console.log(`  ${start} -> +${got.length} (total ${rows.length})`);
    if (got.length < 25000) break;
  }
  fs.writeFileSync("/tmp/gsc_pages.json", JSON.stringify(rows.map((r) => ({ p: r.keys![0], i: r.impressions, c: r.clicks })), null, 0));
  console.log(`ecrit /tmp/gsc_pages.json : ${rows.length} pages`);
})();
