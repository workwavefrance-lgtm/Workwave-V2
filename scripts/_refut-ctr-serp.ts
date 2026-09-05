import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-05", E = "2026-09-01";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const one = async (label: string, dims: string[]) => {
    let all: any[] = [], startRow = 0;
    while (true) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: dims, rowLimit: 25000, startRow, type: "web" } });
      const rows = r.data.rows || []; all.push(...rows);
      if (rows.length < 25000) break; startRow += rows.length;
    }
    const i = all.reduce((s, r) => s + (r.impressions || 0), 0);
    const c = all.reduce((s, r) => s + (r.clicks || 0), 0);
    console.log(`${label.padEnd(26)} ${String(all.length).padStart(7)} lignes | ${String(i).padStart(7)} imp | ${String(c).padStart(6)} clics`);
    return { i, c, all };
  };
  console.log(`Fenetre ${S} .. ${E} (celle de l'audit)`);
  const tot = await one("SANS dimension (TOTAL)", []);
  const q = await one("dimension query", ["query"]);
  const p = await one("dimension page", ["page"]);
  const qp = await one("dimensions query+page", ["query", "page"]);
  console.log(`\nCouverture du jeu query x page utilise par l'audit :`);
  console.log(`  impressions : ${qp.i} / ${tot.i} = ${(100 * qp.i / tot.i).toFixed(1)} %`);
  console.log(`  clics       : ${qp.c} / ${tot.c} = ${(100 * qp.c / tot.c).toFixed(1)} %`);
  console.log(`  (dimension query seule : ${(100 * q.c / tot.c).toFixed(1)} % des clics, dimension page seule : ${(100 * p.c / tot.c).toFixed(1)} %)`);
}
main().catch(e => { console.error("ERREUR", e?.response?.data?.error?.message || e.message); process.exit(1); });
