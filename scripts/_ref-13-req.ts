import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E,
    dimensions: ["page"], rowLimit: 15,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }] } });
  console.log("Top 15 fiches /artisan/ par clics (28 j) :");
  for (const row of (r.data.rows || [])) console.log(`  ${String(row.clicks).padStart(4)} clics | ${String(row.impressions).padStart(4)} imp | pos ${Math.round(row.position||0)} | ${String(row.keys[0]).replace("https://workwave.fr","")}`);
})();
