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
    "https://workwave.fr/trouver-des-chantiers/couvreur",
    "https://workwave.fr/trouver-des-chantiers/plombier",
    "https://workwave.fr/trouver-des-chantiers/electricien",
    "https://workwave.fr/trouver-des-chantiers/peintre",
    "https://workwave.fr/trouver-des-chantiers/vienne-86",
    "https://workwave.fr/trouver-des-chantiers/gironde-33",
    "https://workwave.fr/trouver-des-chantiers/nord-59",
    "https://workwave.fr/trouver-des-clients",
    "https://workwave.fr/trouver-des-clients/menage",
  ];
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      console.log(`${u.replace("https://workwave.fr","")}`);
      console.log(`   ${r.verdict} · ${r.coverageState} · crawl ${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "JAMAIS"} · sitemap ${r.sitemap ? r.sitemap.length : 0} · referents ${r.referringUrls ? r.referringUrls.length : 0}`);
    } catch (e) { console.log(`${u}\n   echec : ${(e as Error).message.slice(0,140)}`); }
    await new Promise(r=>setTimeout(r,300));
  }
})();
