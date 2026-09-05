import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const urls = fs.readFileSync("/tmp/ech-spe.txt", "utf8").trim().split("\n");
  let indexees = 0;
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      if (r.verdict === "PASS") indexees++;
      console.log(`${(r.verdict||"?").padEnd(8)} | ${(r.coverageState||"?").padEnd(46)} | explo ${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "JAMAIS"} | sitemap ${r.sitemap ? "oui" : "NON"} | ${u.replace("https://workwave.fr","")}`);
    } catch (e) { console.log(`echec ${u} : ${(e as Error).message.slice(0,90)}`); }
    await new Promise(r => setTimeout(r, 400));
  }
  console.log(`\nindexees : ${indexees}/${urls.length}`);
})();
