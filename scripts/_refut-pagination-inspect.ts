import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const urls = [
    // fiches de la DERNIERE page (rang ~361-363) du listing /plombier/paris
    "https://workwave.fr/artisan/pierre-peter-mbo-ngokama-00010",
    "https://workwave.fr/plombier/vienne-86",
    "https://workwave.fr/",
    // page de pagination elle-meme
    "https://workwave.fr/plombier/paris/page/2",
    "https://workwave.fr/plombier/paris",
  ];
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      console.log(`\n${u}`);
      console.log(`   verdict     : ${r.verdict} · ${r.coverageState}`);
      console.log(`   sitemap     : ${r.sitemap ? JSON.stringify(r.sitemap) : "aucun"}`);
      console.log(`   referrers   : ${r.referringUrls ? JSON.stringify(r.referringUrls).slice(0,200) : "aucun"}`);
      console.log(`   crawle le   : ${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "jamais"}`);
      console.log(`   canonique G : ${r.googleCanonical || "-"} | declaree : ${r.userCanonical || "-"}`);
    } catch (e) { console.log(`\n${u}\n   echec : ${(e as Error).message.slice(0,160)}`); }
  }
})();
