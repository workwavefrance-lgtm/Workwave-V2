import { google } from "googleapis";
import fs from "fs";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  let all: any[] = [];
  for (let start = 0; start < 200000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
  }
  const art = all.filter(r => r.keys![0].includes("/artisan/")).map(r => ({
    slug: decodeURIComponent(r.keys![0].split("/artisan/")[1].replace(/\/$/,"")),
    c: r.clicks||0, i: r.impressions||0, pos: r.position||0
  }));
  fs.writeFileSync("/tmp/artisan-gsc.json", JSON.stringify(art));
  console.log("fiches /artisan/ avec impressions :", art.length);
  console.log("dont avec >=1 clic :", art.filter(a=>a.c>0).length);
  console.log("total clics :", art.reduce((s,a)=>s+a.c,0), "| total impr :", art.reduce((s,a)=>s+a.i,0));
}
main().catch(e=>console.error(e.message));
