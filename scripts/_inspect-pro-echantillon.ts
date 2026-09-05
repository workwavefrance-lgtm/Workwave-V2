import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const urls = [
    "/trouver-des-chantiers/couvreur","/trouver-des-chantiers/carreleur","/trouver-des-chantiers/menuisier",
    "/trouver-des-chantiers/terrassier","/trouver-des-chantiers/elagueur","/trouver-des-chantiers/serrurier",
    "/trouver-des-chantiers/gironde-33","/trouver-des-chantiers/nord-59","/trouver-des-chantiers/paris-75",
    "/trouver-des-clients/garde-enfants","/trouver-des-clients/jardinage","/trouver-des-clients/demenagement",
  ].map(p=>"https://workwave.fr"+p);
  let ok=0,total=0, crawled=0;
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: "https://workwave.fr/" } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      total++; if (r.verdict==="PASS") ok++; if (r.lastCrawlTime) crawled++;
      console.log(`${(r.verdict==="PASS"?"INDEXEE":"NON INDEXEE").padEnd(12)} | ${String(r.coverageState).padEnd(36)} | crawl ${r.lastCrawlTime?r.lastCrawlTime.slice(0,10):"jamais"} | ${u.replace("https://workwave.fr","")}`);
    } catch(e){ console.log(`ERREUR ${u} ${(e as Error).message.slice(0,60)}`); }
    await new Promise(r=>setTimeout(r,900));
  }
  console.log(`\nEchantillon : ${ok}/${total} indexees · ${crawled}/${total} deja explorees au moins une fois`);
})();
