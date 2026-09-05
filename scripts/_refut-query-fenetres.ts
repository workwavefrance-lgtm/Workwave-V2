import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const W: Record<string, {s:string;e:string}> = {
  "juin (05/06-02/07)": { s: "2026-06-05", e: "2026-07-02" },
  "juillet (03/07-30/07)": { s: "2026-07-03", e: "2026-07-30" },
  "p28 (08/07-04/08)": { s: "2026-07-08", e: "2026-08-04" },
  "r28 (05/08-01/09)": { s: "2026-08-05", e: "2026-09-01" },
};
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  for (const [nom, w] of Object.entries(W)) {
    const t = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: w.s, endDate: w.e, type: "web" } });
    const T = (t.data.rows || [])[0] || { clicks: 0, impressions: 0 };
    const all: any[] = []; let startRow = 0;
    while (true) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: w.s, endDate: w.e, dimensions: ["query"], rowLimit: 25000, startRow, type: "web" } });
      const rows = r.data.rows || []; if (rows.length === 0) break;
      all.push(...rows); startRow += rows.length; if (all.length > 150000) break;
    }
    const qc = all.reduce((a, r) => a + (r.clicks || 0), 0), qi = all.reduce((a, r) => a + (r.impressions || 0), 0);
    console.log(`${nom.padEnd(24)} total ${String(T.clicks).padStart(6)} clics | query ${String(all.length).padStart(6)} lignes, ${String(qc).padStart(5)} clics = ${(100*qc/(T.clicks||1)).toFixed(1)}% | imp ${(100*qi/(T.impressions||1)).toFixed(1)}%`);
  }
  // Validation du denominateur : la dimension date n'est PAS anonymisee, elle doit rendre 100%
  const d = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["date"], rowLimit: 25000, type: "web" } });
  const dr = d.data.rows || [];
  console.log(`\nCONTROLE denominateur r28 : dimension date = ${dr.length} jours, ${dr.reduce((a,r)=>a+(r.clicks||0),0)} clics, ${dr.reduce((a,r)=>a+(r.impressions||0),0)} imp`);
}
main().catch(e => { console.error("ERREUR", e?.response?.data?.error?.message || e.message); process.exit(1); });
