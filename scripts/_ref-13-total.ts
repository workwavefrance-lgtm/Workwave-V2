import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  const tot = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E } });
  const t = (tot.data.rows || [])[0] || {};
  console.log(`SITE ENTIER ${S} -> ${E} : ${t.clicks} clics · ${t.impressions} imp · ${(t.clicks/28).toFixed(1)} clics/jour`);
  const art = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }] } });
  const a = (art.data.rows || [])[0] || {};
  console.log(`FAMILLE /artisan/ (agrege, non tronque) : ${a.clicks} clics · ${a.impressions} imp · ${(a.clicks/28).toFixed(1)} clics/jour`);
  console.log(`part de /artisan/ dans les clics du site : ${(100*(a.clicks||0)/(t.clicks||1)).toFixed(1)} %`);
  console.log(`couverture de mon echantillon 25 000 pages : ${(100*8737/(a.clicks||1)).toFixed(1)} % des clics /artisan/`);
})();
