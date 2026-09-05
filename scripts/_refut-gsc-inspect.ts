import * as dotenv from "dotenv"; import path from "path"; import * as fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  // 8 fiches REELLEMENT crawlees par Googlebot le 03/09 (tirees du journal Traefik)
  const slugs = fs.readFileSync("/tmp/slugs_gbot_0309.txt", "utf8").split("\n").filter(Boolean);
  const ech = [0, 90, 180, 270, 360, 450, 540, 630].map(i => slugs[i]).filter(Boolean);
  for (const s of ech) {
    const u = `https://workwave.fr/artisan/${s}`;
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      console.log(`\n${s}`);
      console.log(`   verdict/couverture : ${r.verdict} · ${r.coverageState}`);
      console.log(`   sitemaps declares  : ${r.sitemap ? JSON.stringify(r.sitemap) : "AUCUN"}`);
      console.log(`   urls referentes    : ${r.referringUrls ? JSON.stringify(r.referringUrls).slice(0,150) : "aucune"}`);
      console.log(`   derniere explo.    : ${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "jamais"}   robots:${r.robotsTxtState}`);
    } catch (e) { console.log(`\n${s}\n   echec : ${(e as Error).message.slice(0,140)}`); }
    await new Promise(r => setTimeout(r, 1200));
  }
})();
