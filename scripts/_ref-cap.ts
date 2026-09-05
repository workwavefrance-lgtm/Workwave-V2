import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  for (const start of [0, 4998, 9998, 19998]) {
    const r = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: "2026-08-28", endDate: "2026-08-28", dimensions: ["page"], rowLimit: 25000, startRow: start } });
    console.log(`  startRow=${start} -> ${(r.data.rows || []).length} lignes`);
  }
  const t = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: "2026-08-28", endDate: "2026-08-28", dimensions: [] } });
  console.log(`  total du 28/08 sans dimension : ${t.data.rows?.[0].clicks} clics ${t.data.rows?.[0].impressions} impressions`);
})().catch(e => console.error("ERR", e.message));
