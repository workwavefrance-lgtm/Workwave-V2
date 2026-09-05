import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const urls = [
    "https://workwave.fr/trouver-des-chantiers",
    "https://workwave.fr/trouver-des-chantiers/plombier",
    "https://workwave.fr/trouver-des-chantiers/peintre",
    "https://workwave.fr/trouver-des-chantiers/cuisiniste",
    "https://workwave.fr/trouver-des-chantiers/vienne-86",
    "https://workwave.fr/trouver-des-chantiers/electricien",
    "https://workwave.fr/trouver-des-clients/menage",
    "https://workwave.fr/trouver-des-clients",
    "https://workwave.fr/pro",
  ];
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      console.log(`\n${u.replace("https://workwave.fr","")}`);
      console.log(`   verdict    : ${r.verdict} · ${r.coverageState}`);
      console.log(`   sitemap    : ${r.sitemap ? JSON.stringify(r.sitemap) : "AUCUN"}`);
      console.log(`   referents  : ${r.referringUrls ? JSON.stringify(r.referringUrls).slice(0,150) : "aucun"}`);
      console.log(`   crawl      : ${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "JAMAIS"}`);
    } catch (e) { console.log(`\n${u}\n   echec : ${(e as Error).message.slice(0,140)}`); }
  }
})();
