import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const urls = [
    "https://workwave.fr/blog/obtenir-leads-artisan-gironde-33-guide-2026",
    "https://workwave.fr/blog/obtenir-leads-artisan-vienne-86-guide-2026",
    "https://workwave.fr/blog/obtenir-leads-artisan-nouvelle-aquitaine-guide-2026",
  ];
  for (const u of urls) {
    const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: "https://workwave.fr/" } });
    const r: any = data.inspectionResult?.indexStatusResult || {};
    console.log(`${(r.verdict==="PASS"?"INDEXEE":"NON INDEXEE").padEnd(12)} | ${String(r.coverageState).padEnd(40)} | crawl ${r.lastCrawlTime?r.lastCrawlTime.slice(0,10):"jamais"} | ${u.replace("https://workwave.fr/blog/","")}`);
    await new Promise(r=>setTimeout(r,800));
  }
})();
