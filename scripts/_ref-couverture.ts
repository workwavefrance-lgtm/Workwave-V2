import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const W = { s: "2026-08-05", e: "2026-09-01" };
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const q = async (dims: string[], label: string) => {
    const all: any[] = []; let startRow = 0;
    while (true) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: W.s, endDate: W.e, dimensions: dims, rowLimit: 25000, startRow, type: "web" } });
      const rows = r.data.rows || []; all.push(...rows);
      if (rows.length < 25000) break; startRow += rows.length;
    }
    const imp = all.reduce((a, r) => a + (r.impressions || 0), 0);
    const cl = all.reduce((a, r) => a + (r.clicks || 0), 0);
    console.log(`${label.padEnd(26)} ${String(all.length).padStart(7)} lignes | ${String(imp).padStart(8)} imp | ${String(cl).padStart(6)} clics`);
    return { imp, cl };
  };
  const tot = await q([], "TOTAL (sans dimension)");
  const pg = await q(["page"], "dim page");
  const qu = await q(["query"], "dim query");
  const qp = await q(["query", "page"], "dim query x page");
  console.log("");
  console.log(`couverture dim page      : ${(100*pg.imp/tot.imp).toFixed(1)}% des imp, ${(100*pg.cl/tot.cl).toFixed(1)}% des clics`);
  console.log(`couverture dim query     : ${(100*qu.imp/tot.imp).toFixed(1)}% des imp, ${(100*qu.cl/tot.cl).toFixed(1)}% des clics`);
  console.log(`couverture dim query+page: ${(100*qp.imp/tot.imp).toFixed(1)}% des imp, ${(100*qp.cl/tot.cl).toFixed(1)}% des clics`);
})();
