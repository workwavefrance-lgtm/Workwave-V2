import { google } from "googleapis";
import fs from "fs";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const rows: any[] = [];
  for (let start = 0; start < 200000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: "2026-08-01", endDate: "2026-08-31", dimensions: ["page"], rowLimit: 25000, startRow: start, type: "web" } });
    const got = r.data.rows || [];
    rows.push(...got);
    console.log(`  startRow ${start}: ${got.length} lignes (cumul ${rows.length})`);
    if (got.length < 25000) break;
  }
  fs.writeFileSync("/tmp/gsc-pages-aout.json", JSON.stringify(rows));
  const tot = rows.reduce((a, r) => ({ i: a.i + (r.impressions||0), c: a.c + (r.clicks||0) }), { i: 0, c: 0 });
  console.log(`TOTAL pages avec impressions en aout : ${rows.length} | impressions ${tot.i} | clics ${tot.c}`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
