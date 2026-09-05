import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis"; import fs from "fs";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const out = fs.createWriteStream("/tmp/jpj.txt");
  const fiches = new Set<string>(), toutes = new Set<string>();
  let impF = 0, clF = 0, impTot = 0;
  const d0 = new Date("2026-08-05T00:00:00Z");
  for (let i = 0; i < 28; i++) {
    const d = new Date(d0.getTime() + i * 86400000).toISOString().slice(0, 10);
    let start = 0, n = 0;
    while (true) {
      const r = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: d, endDate: d, dimensions: ["page"], rowLimit: 25000, startRow: start } });
      const rows = r.data.rows || [];
      if (!rows.length) break;
      for (const row of rows) {
        const u = row.keys![0]; toutes.add(u); impTot += row.impressions || 0;
        if (u.includes("/artisan/")) { fiches.add(u); impF += row.impressions || 0; clF += row.clicks || 0; }
      }
      n += rows.length; start += rows.length;
      if (rows.length < 25000) break;
    }
    out.write(`${d} : ${n} lignes | cumul fiches distinctes ${fiches.size}\n`);
  }
  out.write(`\n=== UNION DES 28 REQUETES JOURNALIERES ===\n`);
  out.write(`  pages distinctes toutes categories : ${toutes.size}\n`);
  out.write(`  FICHES /artisan/ distinctes exposees : ${fiches.size}\n`);
  out.write(`  impressions attribuees (somme jours) : ${impTot}\n`);
  out.write(`  impressions fiches : ${impF} | clics fiches : ${clF}\n`);
  out.write(`  production unitaire reelle : ${(clF / fiches.size).toFixed(4)} clic/fiche/28j\n`);
  out.end();
})().catch(e => fs.appendFileSync("/tmp/jpj.txt", "FATAL " + e.message));
