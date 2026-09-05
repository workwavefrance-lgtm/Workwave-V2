import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const urls = [
    "https://workwave.fr/artisan/jacky-roy-00016",
    "https://workwave.fr/artisan/jean-farvault-00013",
    "https://workwave.fr/artisan/ri-renovation-00018",
  ];
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      console.log(u.replace("https://workwave.fr", ""));
      console.log("   verdict          :", data.inspectionResult?.indexStatusResult?.verdict);
      console.log("   etat couverture  :", r.coverageState);
      console.log("   sitemaps declares:", r.sitemap ? JSON.stringify(r.sitemap) : "AUCUN");
      console.log("   referent decouv. :", r.referringUrls ? r.referringUrls.length + " lien(s)" : "aucun");
      console.log("   dernier crawl    :", r.lastCrawlTime || "jamais");
    } catch (e: any) { console.log(u, "ERREUR", e.message); }
  }
})();
