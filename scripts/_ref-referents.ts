import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const SITE = "https://workwave.fr/";
  for (const slug of ["jacques-pabion-00010","les-eclates-00017","claude-grany-00011","4r-architecte-00019"]) {
    const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: `https://workwave.fr/artisan/${slug}`, siteUrl: SITE } });
    const r: any = data.inspectionResult?.indexStatusResult || {};
    console.log(`\n${slug}  [${r.coverageState}]`);
    console.log(`  sitemap        : ${r.sitemap ? JSON.stringify(r.sitemap) : "AUCUN"}`);
    console.log(`  referringUrls  : ${r.referringUrls ? JSON.stringify(r.referringUrls) : "AUCUN"}`);
    console.log(`  canonique G    : ${r.googleCanonical}`);
  }
})();
