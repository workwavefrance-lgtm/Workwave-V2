import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const cibles = ["/pro/sans-abonnement","/pro/alternatives/habitatpresto","/pro/alternatives/travaux-com","/pro/alternatives/starofservice","/pro"];
  for (const c of cibles) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: "2026-06-04", endDate: "2026-09-02", dimensions: ["page"], rowLimit: 10,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "equals", expression: "https://workwave.fr"+c }] }]
    }});
    const rows = r.data.rows || [];
    console.log(rows.length ? `  ${String(rows[0].impressions).padStart(5)} imp | ${rows[0].clicks} clics | pos ${(rows[0].position||0).toFixed(1)} | ${c}` : `      0 impression (filtre exact)                 | ${c}`);
    await new Promise(r=>setTimeout(r,400));
  }
})();
