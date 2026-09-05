import * as path from "path"; import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: await auth.getClient() as any });
  const site = "https://workwave.fr/";
  const urls = [
    "https://workwave.fr/guide-des-prix/prix-renovation-meuble-tapisse",
    "https://workwave.fr/guide-des-prix/prix-maintenance-ascenseur",
    "https://workwave.fr/guide-des-prix/prix-abattage-darbres",
    "https://workwave.fr/peintre/prix",
  ];
  for (const u of urls) {
    try {
      const r: any = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const i = r.data.inspectionResult?.indexStatusResult || {};
      console.log("URL:", u);
      console.log("   verdict:", i.verdict, "| coverage:", i.coverageState);
      console.log("   userCanonical:", i.userCanonical);
      console.log("   googleCanonical:", i.googleCanonical);
      console.log("   lastCrawl:", i.lastCrawlTime, "| indexingState:", i.indexingState);
      console.log("");
    } catch (e: any) { console.log("URL:", u, "ERR", e.message); }
  }
})();
