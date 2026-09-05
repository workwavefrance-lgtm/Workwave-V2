import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const lignes = fs.readFileSync(process.argv[2], "utf8").split("\n").map(s=>s.trim()).filter(Boolean);
  const compte: Record<string, number> = {};
  for (const ligne of lignes) {
    const [grp, u] = ligne.split(" ");
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      const etat = r.coverageState || "?";
      compte[etat] = (compte[etat] || 0) + 1;
      console.log(`${grp}  ${etat.padEnd(34)} crawl=${r.lastCrawlTime?r.lastCrawlTime.slice(0,10):"jamais"}  sitemapGSC=${r.sitemap?r.sitemap.length:0}  ${u.replace("https://workwave.fr","")}`);
    } catch (e) { console.log(`${grp}  ECHEC ${(e as Error).message.slice(0,80)}`); }
    await new Promise(r=>setTimeout(r,1100));
  }
  console.log("\n=== SYNTHESE ===");
  const tot = Object.values(compte).reduce((a,b)=>a+b,0);
  for (const [k,v] of Object.entries(compte).sort((a,b)=>b[1]-a[1])) console.log(`${String(v).padStart(3)}  ${(100*v/tot).toFixed(0).padStart(3)}%  ${k}`);
})();
