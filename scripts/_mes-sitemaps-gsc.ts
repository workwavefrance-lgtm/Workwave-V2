import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const { data } = await sc.sitemaps.list({ siteUrl: site });
  const sm = data.sitemap || [];
  console.log(`sitemaps declares dans GSC : ${sm.length}`);
  for (const s of sm) {
    const c = (s.contents || []).map(x => `${x.type}=${x.submitted}/${x.indexed ?? "?"}`).join(" ");
    console.log(`\n  ${s.path}`);
    console.log(`    type=${s.type} index=${s.isSitemapsIndex ?? false} pending=${s.isPending}`);
    console.log(`    soumis le      : ${s.lastSubmitted?.slice(0,19)}`);
    console.log(`    TELECHARGE le  : ${s.lastDownloaded ? s.lastDownloaded.slice(0,19) : "JAMAIS"}`);
    console.log(`    erreurs=${s.errors} avertissements=${s.warnings}  contenu: ${c}`);
  }
})();
