import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const ech = JSON.parse(fs.readFileSync("/tmp/echantillon.json","utf8")) as {m:string;v:string}[];
  const compte: Record<string, number> = {};
  for (const c of ech) {
    const u = `https://workwave.fr/${c.m}/${c.v}`;
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      compte[r.coverageState || "?"] = (compte[r.coverageState || "?"] || 0) + 1;
      console.log(`${(c.m+"/"+c.v).padEnd(48)} ${String(r.verdict).padEnd(8)} | ${String(r.coverageState).padEnd(46)} | crawl ${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "jamais"} | sitemap ${r.sitemap ? "oui" : "non"} | refUrls ${r.referringUrls ? "oui" : "non"}`);
    } catch (e: any) { console.log(`${c.m}/${c.v} echec ${(e.message||"").slice(0,90)}`); }
    await new Promise(r => setTimeout(r, 400));
  }
  console.log("\nRECAP :", JSON.stringify(compte, null, 1));
})();
