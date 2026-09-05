import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const R28 = { s: "2026-08-05", e: "2026-09-01" };

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });

  // 1. Total sans dimension, r28, type web
  const t = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: R28.s, endDate: R28.e, type: "web" } });
  const T = (t.data.rows || [])[0];
  console.log(`TOTAL r28 (sans dimension, web) : ${T?.clicks} clics | ${T?.impressions} imp`);

  // 2. Query dimension, pagination JUSQU'A page vide (pas "< 25000")
  const all: any[] = []; let startRow = 0; let pages = 0;
  while (true) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: R28.s, endDate: R28.e, dimensions: ["query"], rowLimit: 25000, startRow, type: "web" } });
    const rows = r.data.rows || []; pages++;
    console.log(`  page ${pages} startRow=${startRow} -> ${rows.length} lignes`);
    if (rows.length === 0) break;
    all.push(...rows); startRow += rows.length;
    if (pages > 12) break;
  }
  const qi = all.reduce((a, r) => a + (r.impressions || 0), 0), qc = all.reduce((a, r) => a + (r.clicks || 0), 0);
  console.log(`QUERY r28 re-mesure : ${all.length} lignes | ${qi} imp (${(100*qi/(T?.impressions||1)).toFixed(1)}%) | ${qc} clics (${(100*qc/(T?.clicks||1)).toFixed(1)}%)`);
}
main().catch(e => { console.error("ERREUR", e?.response?.data?.error?.message || e.message); process.exit(1); });
