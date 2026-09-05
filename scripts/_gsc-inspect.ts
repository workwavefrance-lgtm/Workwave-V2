import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const urls = [
    "https://workwave.fr/artisan/lucien-malicet-00014",
    "https://workwave.fr/plombier/vienne-86",
    "https://workwave.fr/",
  ];
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({
        requestBody: { inspectionUrl: u, siteUrl: site },
      });
      const r = data.inspectionResult?.indexStatusResult || {};
      console.log(`\n${u}`);
      console.log(`   etat            : ${r.verdict} · ${r.coverageState}`);
      console.log(`   decouverte par  : ${r.robotsTxtState === "ALLOWED" ? "" : r.robotsTxtState + " "}${(r as any).sitemap ? JSON.stringify((r as any).sitemap) : "AUCUN SITEMAP"}`);
      console.log(`   lien referent   : ${(r as any).referringUrls ? "oui" : "non"}`);
      console.log(`   derniere explo. : ${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "jamais"}`);
    } catch (e) {
      console.log(`\n${u}\n   echec : ${(e as Error).message.slice(0,120)}`);
    }
  }
})();
