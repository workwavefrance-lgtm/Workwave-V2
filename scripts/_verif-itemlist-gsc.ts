import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const urls = [
    "https://workwave.fr/demenagement/gironde-33",
    "https://workwave.fr/plombier/gironde-33",
    "https://workwave.fr/electricien/vienne-86",
  ];
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const res: any = data.inspectionResult || {};
      const r = res.indexStatusResult || {};
      console.log(`\n${u}`);
      console.log(`  index    : ${r.verdict} · ${r.coverageState}`);
      console.log(`  crawl    : ${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "jamais"}`);
      console.log(`  richResultsResult : ${res.richResultsResult ? JSON.stringify(res.richResultsResult) : "AUCUN type de resultat enrichi detecte"}`);
    } catch (e) { console.log(`\n${u}\n  echec : ${(e as Error).message.slice(0,160)}`); }
  }
})();
