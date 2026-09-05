import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const siteUrl = "https://workwave.fr/";
  const urls = fs.readFileSync("/tmp/insp.txt", "utf8").split("\n").map(s => s.trim()).filter(Boolean);
  const tally: Record<string, number> = {};
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      const etat = `${r.verdict}/${r.coverageState}`;
      tally[etat] = (tally[etat] || 0) + 1;
      console.log(`${etat.padEnd(42)} crawl=${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "jamais"}  ${u.replace("https://workwave.fr","")}`);
    } catch (e) { console.log(`ECHEC ${u} : ${(e as Error).message.slice(0,90)}`); }
  }
  console.log("\nRECAP :"); Object.entries(tally).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${v} x ${k}`));
})();
