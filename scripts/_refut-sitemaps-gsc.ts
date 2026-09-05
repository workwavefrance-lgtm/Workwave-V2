import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const { data } = await sc.sitemaps.list({ siteUrl: site });
  const l = data.sitemap || [];
  console.log(`SITEMAPS ENREGISTRES DANS GSC : ${l.length}`);
  for (const s of l) {
    const c = (s.contents || []).map((x: any) => `${x.type}:soumis=${x.submitted}${x.indexed !== undefined ? " indexe=" + x.indexed : ""}`).join(" | ");
    console.log(`
  ${s.path}`);
    console.log(`    type=${s.type} index=${s.isSitemapsIndex} en_attente=${s.isPending}`);
    console.log(`    soumis_le=${(s.lastSubmitted||"-").slice(0,10)}  TELECHARGE_PAR_GOOGLE_LE=${(s.lastDownloaded||"JAMAIS").slice(0,19)}`);
    console.log(`    erreurs=${s.errors} avertissements=${s.warnings}`);
    console.log(`    contenu=${c || "(vide)"}`);
  }
})();
