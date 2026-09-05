import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const urls = [
    "https://workwave.fr/plombier/debouchage/chauvigny",
    "https://workwave.fr/carreleur/terrasse/la-rochelle",
    "https://workwave.fr/carreleur/salle-de-bain/paris",
    "https://workwave.fr/plombier/depannage/namur",
    "https://workwave.fr/electricien/domotique/nanterre",
    "https://workwave.fr/macon/extension/levallois-perret",
    "https://workwave.fr/paysagiste/terrasse/marseille",
    "https://workwave.fr/peintre/interieur/limoges",
  ];
  for (const u of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      console.log(`${u}\n   ${r.verdict} · ${r.coverageState} · explo=${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "JAMAIS"} · sitemap=${r.sitemap ? "OUI" : "non"} · referents=${r.referringUrls ? r.referringUrls.length : 0} · canonicalG=${(r.googleCanonical||"-").replace("https://workwave.fr","")}`);
    } catch (e) { console.log(`${u}\n   echec : ${(e as Error).message.slice(0,120)}`); }
    await new Promise(r=>setTimeout(r,900));
  }
})();
