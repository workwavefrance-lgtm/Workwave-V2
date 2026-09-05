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
    "https://workwave.fr/artisan/barthol-fabien-37174",
    "https://workwave.fr/artisan/bouron-roger-59411",
    "https://workwave.fr/guide-des-prix/prix-pose-carrelage",
  ];
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      console.log(`\n${u}`);
      console.log(`   verdict=${r.verdict} etat=${r.coverageState}`);
      console.log(`   sitemap declare par Google : ${r.sitemap ? JSON.stringify(r.sitemap) : "AUCUN"}`);
      console.log(`   referringUrls : ${r.referringUrls ? JSON.stringify(r.referringUrls).slice(0,90) : "aucun"}`);
      console.log(`   dernier crawl : ${r.lastCrawlTime ? r.lastCrawlTime.slice(0,19) : "jamais"}`);
    } catch (e) { console.log(`\n${u}\n   echec : ${(e as Error).message.slice(0,140)}`); }
  }
})();
