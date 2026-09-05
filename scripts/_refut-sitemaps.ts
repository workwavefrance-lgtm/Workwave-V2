import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const { data } = await sc.sitemaps.list({ siteUrl: "https://workwave.fr/" });
  for (const s of data.sitemap || []) {
    const c: any = (s.contents || [])[0] || {};
    console.log(`${s.path}\n   dernier telechargement Google : ${s.lastDownloaded || "JAMAIS"} | erreurs ${s.errors} | avertissements ${s.warnings} | URLs vues ${c.submitted || "-"}`);
  }
})();
