import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const urls = fs.readFileSync("/tmp/urls141.txt","utf8").trim().split("\n");
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: "https://workwave.fr/" } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      console.log(u.replace("https://workwave.fr",""), "|", r.verdict, "|", r.coverageState, "| sitemap:", JSON.stringify(r.sitemap ?? null), "| crawl:", r.lastCrawlTime ?? "jamais");
    } catch (e: any) { console.log(u, "ERREUR", e.message); }
  }
})();
