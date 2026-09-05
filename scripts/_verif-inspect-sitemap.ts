import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const urls = [
  "https://workwave.fr/",
  "https://workwave.fr/plombier/poitiers",
  "https://workwave.fr/electricien/vienne-86",
];
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({
        requestBody: { inspectionUrl: u, siteUrl: "https://workwave.fr/" },
      });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      console.log(u);
      console.log("   verdict", r.verdict, "| couverture", r.coverageState);
      console.log("   sitemaps referencants:", JSON.stringify(r.sitemap ?? null));
      console.log("   referrer:", r.referringUrls ? r.referringUrls.length + " liens" : "aucun");
      console.log("   dernier crawl:", r.lastCrawlTime);
    } catch (e: any) { console.log(u, "ERREUR", e.message); }
  }
})();
