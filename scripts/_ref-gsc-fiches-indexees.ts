import { google } from "googleapis";
import * as fs from "fs";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000 } });
  const rows = (r.data.rows || []).filter((x: any) => x.keys[0].includes("/artisan/") && x.clicks > 0);
  rows.sort((a: any, b: any) => b.clicks - a.clicks);
  const top = rows.slice(0, 40).map((x: any) => ({ url: x.keys[0], clics: x.clicks, imp: x.impressions }));
  fs.writeFileSync("/tmp/_fiches-cliquees.json", JSON.stringify(top, null, 1));
  console.log(`fiches avec clics : ${rows.length}`);
  top.slice(0, 12).forEach(t => console.log(`  ${t.clics} clics ${t.imp} imp  ${t.url.replace("https://workwave.fr","")}`));
})();
