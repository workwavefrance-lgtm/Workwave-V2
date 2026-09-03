/**
 * Pages qui recevaient des clics du 25/07 au 14/08 et n'ont plus AUCUNE
 * impression du 25 au 31/08 : celles que Google a retirees. Triees par clics
 * perdus. Sortie : scripts/pages-perdues.txt, consommee par
 * ping-quotidien.ts --liste (195 par jour, reprise automatique).
 */
import { config } from "dotenv"; import path from "path"; import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const pages = async (startDate: string, endDate: string) => {
    const m = new Map<string, number>();
    for (let startRow = 0; ; startRow += 25000) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate, endDate, dimensions: ["page"], rowLimit: 25000, startRow } });
      const rows = r.data.rows || [];
      for (const x of rows) m.set(x.keys![0].split("?")[0], x.clicks || 0);
      if (rows.length < 25000) break;
    }
    return m;
  };
  const avant = await pages("2026-07-25", "2026-08-14");
  const apres = await pages("2026-08-25", "2026-08-31");
  const perdues = [...avant].filter(([u, c]) => c >= 1 && !apres.has(u) && u.startsWith(SITE)).sort((a, b) => b[1] - a[1]);
  const liste = perdues.slice(0, 600).map(([u]) => u);
  fs.writeFileSync("scripts/pages-perdues.txt", liste.join("\n") + "\n");
  console.log(`${perdues.length} pages perdues (>=1 clic avant, 0 impression apres), ${liste.length} retenues, ${perdues.slice(0, 600).reduce((s, [, c]) => s + c, 0)} clics perdus -> scripts/pages-perdues.txt`);
})();
