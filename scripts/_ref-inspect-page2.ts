import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const urls = [
    // 3 fiches situees AU-DELA du rang 10 sur /plombier/paris (donc "hors d'atteinte" selon l'audit)
    "https://workwave.fr/artisan/ag2-plomberie-renovation-00023",
    "https://workwave.fr/artisan/aissa-00013",
    "https://workwave.fr/artisan/ajl-00017",
    // la page de pagination elle-meme
    "https://workwave.fr/plombier/paris/page/2",
    "https://workwave.fr/plombier/paris",
  ];
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      console.log(`\n${u}`);
      console.log(`   verdict         : ${r.verdict} · ${r.coverageState}`);
      console.log(`   sitemaps        : ${r.sitemap ? JSON.stringify(r.sitemap) : "AUCUN"}`);
      console.log(`   referents       : ${r.referringUrls ? JSON.stringify(r.referringUrls).slice(0,150) : "aucun"}`);
      console.log(`   derniere explo. : ${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "jamais"}`);
      console.log(`   canonical Google: ${r.googleCanonical || "-"}`);
    } catch (e) { console.log(`\n${u}\n   echec : ${(e as Error).message.slice(0,150)}`); }
  }
})();
