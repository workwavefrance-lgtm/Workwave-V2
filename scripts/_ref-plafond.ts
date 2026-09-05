import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  console.log("date        | total imp | imp attribuees aux lignes | imp cachees | lignes | derniere ligne (imp)");
  let cachTot = 0, dernSom = 0, n = 0;
  for (const d of ["2026-08-20", "2026-08-25", "2026-08-28", "2026-08-31", "2026-09-01"]) {
    const t = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: d, endDate: d, dimensions: [] } });
    const tot = t.data.rows?.[0].impressions || 0;
    const r = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: d, endDate: d, dimensions: ["page"], rowLimit: 25000 } });
    const rows = r.data.rows || [];
    const att = rows.reduce((a, x) => a + (x.impressions || 0), 0);
    const dern = rows[rows.length - 1]?.impressions || 0;
    console.log(`${d} | ${String(tot).padStart(9)} | ${String(att).padStart(25)} | ${String(tot - att).padStart(11)} | ${String(rows.length).padStart(6)} | ${dern}`);
    cachTot += tot - att; dernSom += dern; n++;
  }
  console.log(`\n  impressions cachees en moyenne : ${Math.round(cachTot / n)} / jour`);
  console.log(`  la derniere ligne servie vaut en moyenne ${(dernSom / n).toFixed(1)} impression(s)`);
  console.log(`  => pages cachees estimees : ~${Math.round(cachTot / n / Math.max(dernSom / n, 1))} par jour au-dela du plafond`);
})().catch(e => console.error("ERR", e.message));
