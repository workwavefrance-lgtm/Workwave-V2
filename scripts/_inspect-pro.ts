import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const urls = [
    "https://workwave.fr/pro",
    "https://workwave.fr/pro/sans-abonnement",
    "https://workwave.fr/pro/alternatives/habitatpresto",
    "https://workwave.fr/pro/alternatives/travaux-com",
    "https://workwave.fr/trouver-des-chantiers",
    "https://workwave.fr/trouver-des-chantiers/peintre",
    "https://workwave.fr/trouver-des-chantiers/macon",
    "https://workwave.fr/trouver-des-chantiers/electricien",
    "https://workwave.fr/trouver-des-chantiers/plombier",
    "https://workwave.fr/trouver-des-chantiers/bouches-du-rhone-13",
    "https://workwave.fr/trouver-des-clients",
    "https://workwave.fr/trouver-des-clients/menage",
  ];
  let ok=0, ko=0;
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      const v = r.verdict === "PASS" ? (ok++, "INDEXEE") : (ko++, "NON INDEXEE");
      console.log(`${v.padEnd(12)} | ${String(r.coverageState).padEnd(46)} | crawl ${r.lastCrawlTime? r.lastCrawlTime.slice(0,10):"jamais"} | sitemap ${r.sitemap? "oui":"non"} | ${u.replace("https://workwave.fr","")}`);
    } catch (e) { console.log(`ERREUR      | ${u} : ${(e as Error).message.slice(0,80)}`); }
    await new Promise(r=>setTimeout(r,700));
  }
  console.log(`\nBilan : ${ok} indexees / ${ok+ko} inspectees`);
})();
