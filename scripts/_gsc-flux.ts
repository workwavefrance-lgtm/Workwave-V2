import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  for (const p of ["https://workwave.fr/flux-mises-a-jour.xml", "https://workwave.fr/sitemap-index.xml"]) {
    try {
      const { data } = await sc.sitemaps.get({ siteUrl: site, feedpath: p });
      console.log(JSON.stringify(data, null, 2));
    } catch (e: any) { console.log(p, "ERREUR", e.message); }
  }
})();
