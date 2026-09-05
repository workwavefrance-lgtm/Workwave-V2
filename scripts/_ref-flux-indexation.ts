import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const j = (d: Date) => d.toISOString().slice(0,10);
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const site = "https://workwave.fr/";
  const fin = j(new Date(Date.now()-3*86400e3)), deb = j(new Date(Date.now()-31*86400e3));
  let rows: any[] = [], start = 0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl: site, requestBody: {
      startDate: deb, endDate: fin, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const r = data.rows || []; rows.push(...r);
    if (r.length < 25000) break; start += r.length; if (start > 150000) break;
  }
  const connues = new Set(rows.map(r => r.keys![0]));
  const clics: Record<string, number> = {};
  for (const r of rows) clics[r.keys![0]] = r.clicks || 0;

  const slugs = fs.readFileSync("/tmp/slugs.txt","utf8").trim().split("\n");
  const urls = slugs.map(s => `https://workwave.fr/artisan/${s}`);
  const vues = urls.filter(u => connues.has(u));
  const avecClic = vues.filter(u => clics[u] > 0);
  console.log("LES 1000 FICHES ACTUELLEMENT DANS LE FLUX, sur 28 jours de Search Console");
  console.log(`  presentes dans Search Console (>=1 impression) : ${vues.length} / 1000  (${(100*vues.length/1000).toFixed(1)} %)`);
  console.log(`  ayant genere au moins 1 clic                   : ${avecClic.length} / 1000`);
  console.log(`  clics cumules sur 28 jours                     : ${vues.reduce((a,u)=>a+(clics[u]||0),0)}`);

  const ch = rows.filter(r => r.keys![0].includes("/trouver-des-chantiers"));
  console.log("\nLES 25 PAGES CHANTIERS DU FLUX (soumises a Google depuis le 02/09)");
  console.log(`  pages /trouver-des-chantiers avec >=1 impression : ${ch.length}`);
  console.log(`  clics cumules                                    : ${ch.reduce((a,r)=>a+(r.clicks||0),0)}`);
})();
