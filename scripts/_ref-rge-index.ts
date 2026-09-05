import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const urls = [
    "https://workwave.fr/plombier/drome-26",
    "https://workwave.fr/plombier/maine-et-loire-49",
    "https://workwave.fr/couvreur/deux-sevres-79",
    "https://workwave.fr/plaquiste/ardeche-07",
    "https://workwave.fr/cuisiniste/drome-26",
    "https://workwave.fr/architecte/val-de-marne-94",
  ];
  let idx=0, noidx=0;
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      const ok = r.verdict === "PASS";
      ok ? idx++ : noidx++;
      console.log(`${u.replace("https://workwave.fr","")}`);
      console.log(`   ${r.verdict} · ${r.coverageState} · derniere exploration ${r.lastCrawlTime?r.lastCrawlTime.slice(0,10):"JAMAIS"} · sitemap ${r.sitemap?"oui":"AUCUN"}`);
    } catch (e) { console.log(`${u} -> echec ${(e as Error).message.slice(0,90)}`); }
  }
  console.log(`\nindexees ${idx} / ${idx+noidx}`);
})();
