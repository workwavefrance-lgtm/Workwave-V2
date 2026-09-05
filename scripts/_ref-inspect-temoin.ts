import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const urls = [
    "https://workwave.fr/",
    "https://workwave.fr/plombier/vienne-86",
    "https://workwave.fr/plombier/limoges",
    "https://workwave.fr/artisan/lucien-malicet-00014",
  ];
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      console.log(`${u}\n   ${r.verdict} · ${r.coverageState} · sitemaps=${r.sitemap ? JSON.stringify(r.sitemap) : "AUCUN"} · crawl=${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "jamais"}`);
    } catch (e) { console.log(`${u}\n   echec : ${(e as Error).message.slice(0,150)}`); }
  }
})();
