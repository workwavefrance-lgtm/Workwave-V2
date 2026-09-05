import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const fin = new Date(Date.now() - 3*86400e3).toISOString().slice(0,10);
  const debut = new Date(Date.now() - 31*86400e3).toISOString().slice(0,10);
  const { data: tot } = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: debut, endDate: fin } });
  const t = tot.rows?.[0];
  console.log(`TOTAL SITE ${debut}->${fin} : clics=${t?.clicks} impressions=${t?.impressions} position=${t?.position?.toFixed(1)}`);
  let start = 0, n = 0, fiches = 0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl: site, requestBody: {
      startDate: debut, endDate: fin, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = data.rows || [];
    if (rows.length === 0) break;
    n += rows.length;
    fiches += rows.filter(r => r.keys![0].includes("/artisan/")).length;
    start += rows.length;
    if (start >= 200000) break;
  }
  console.log(`pages DISTINCTES avec >=1 impression sur 28 j : ${n}  dont fiches artisan : ${fiches}`);
  console.log(`part des 2 461 391 URL du sitemap qui rapportent une impression : ${(100*n/2461391).toFixed(2)} %`);
})();
