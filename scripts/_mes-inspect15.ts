import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const URLS: [string,string][] = [
  ["accueil","https://workwave.fr/"],
  ["listing gros trafic","https://workwave.fr/plombier/poitiers"],
  ["listing grande ville","https://workwave.fr/terrassier/paris"],
  ["listing ville moyenne","https://workwave.fr/electricien/reze"],
  ["listing dept","https://workwave.fr/carreleur/corse-du-sud-2a"],
  ["listing dept 2","https://workwave.fr/demenagement/vaucluse-84"],
  ["specialite","https://workwave.fr/carreleur/salle-de-bain/paris"],
  ["fiche RECLAMEE ouverte","https://workwave.fr/artisan/damdeco-00011"],
  ["fiche ouverte","https://workwave.fr/artisan/curt-marian-49974"],
  ["fiche ouverte 2","https://workwave.fr/artisan/elys-construction-77292"],
  ["fiche FERMEE","https://workwave.fr/artisan/scic-barsequanaise-00022"],
  ["fiche FERMEE 2","https://workwave.fr/artisan/kevin-nalende-0013"],
  ["guide des prix","https://workwave.fr/guide-des-prix/prix-plomberie"],
  ["trouver des chantiers","https://workwave.fr/trouver-des-chantiers/plombier"],
  ["barometre","https://workwave.fr/barometre-artisans"],
];
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  for (const [label, u] of URLS) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      console.log(`\n[${label}] ${u.replace("https://workwave.fr","")}`);
      console.log(`   verdict     : ${r.verdict}`);
      console.log(`   couverture  : ${r.coverageState}`);
      console.log(`   robots      : ${r.robotsTxtState} | indexation: ${r.indexingState}`);
      console.log(`   sitemap     : ${r.sitemap ? r.sitemap.join(", ") : "AUCUN"}`);
      console.log(`   referents   : ${r.referringUrls ? r.referringUrls.length + " lien(s)" : "aucun"}`);
      console.log(`   dernier crawl: ${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "JAMAIS"}  par ${r.crawledAs || "-"}`);
      console.log(`   canonique G  : ${(r.googleCanonical||"-").replace("https://workwave.fr","")}`);
      console.log(`   canonique nous: ${(r.userCanonical||"-").replace("https://workwave.fr","")}`);
    } catch (e) { console.log(`\n[${label}] ${u}\n   echec : ${(e as Error).message.slice(0,150)}`); }
    await new Promise(r=>setTimeout(r,1200));
  }
})();
