import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const { data } = await sc.sitemaps.list({ siteUrl: site, sitemapIndex: `${site}sitemap-index.xml` });
  const s = data.sitemap || [];
  console.log(`enfants connus de Google : ${s.length}\n`);
  let soumises = 0, jamais = 0, erreurs = 0;
  for (const m of s) {
    const web = (m.contents || []).find((c) => c.type === "web") || {};
    const n = Number(web.submitted || 0);
    soumises += n;
    if (!m.lastDownloaded) jamais++;
    if (Number(m.errors || 0) > 0) erreurs++;
  }
  for (const m of s.slice(0, 12)) {
    const web = (m.contents || []).find((c) => c.type === "web") || {};
    console.log(`  ${(m.path||"").replace(site,"").padEnd(20)} ${String(web.submitted||0).padStart(8)} adresses` +
      `  erreurs ${m.errors ?? 0}  lu le ${m.lastDownloaded ? m.lastDownloaded.slice(0,10) : "JAMAIS"}`);
  }
  if (s.length > 12) console.log(`  ... et ${s.length - 12} autres`);
  console.log(`\n  TOTAL adresses soumises : ${soumises.toLocaleString("fr-FR")}`);
  console.log(`  enfants jamais telecharges : ${jamais}`);
  console.log(`  enfants en erreur          : ${erreurs}`);
})();
