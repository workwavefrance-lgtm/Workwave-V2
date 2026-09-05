import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const OUT = "/private/tmp/gsc"; fs.mkdirSync(OUT, { recursive: true });
const W: any = { m3:{s:"2026-06-05",e:"2026-09-01"}, r28:{s:"2026-08-05",e:"2026-09-01"}, p28:{s:"2026-07-08",e:"2026-08-04"} };
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  // Totaux sans dimension : reference pour mesurer la couverture des extractions
  for (const k of ["m3","r28","p28"]) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: W[k].s, endDate: W[k].e, type: "web" } });
    const t = (r.data.rows||[])[0];
    console.log(`TOTAL ${k}: ${t?.clicks} clics, ${t?.impressions} impressions, pos ${(t?.position||0).toFixed(2)}, CTR ${((t?.ctr||0)*100).toFixed(2)}%`);
  }
  const pull = async (name: string, win: any, dims: string[], max = 200000) => {
    const all: any[] = []; let startRow = 0;
    while (all.length < max) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: win.s, endDate: win.e, dimensions: dims, rowLimit: 25000, startRow, type: "web" } });
      const rows = r.data.rows || []; all.push(...rows);
      if (rows.length < 25000) break; startRow += rows.length;
    }
    fs.writeFileSync(`${OUT}/${name}.json`, JSON.stringify(all));
    const imp = all.reduce((a,r)=>a+(r.impressions||0),0), cl = all.reduce((a,r)=>a+(r.clicks||0),0);
    console.log(`${name.padEnd(12)} ${String(all.length).padStart(7)} lignes | ${imp} imp | ${cl} clics`);
  };
  await pull("q_m3_full",  W.m3,  ["query"]);
  await pull("q_p28_full", W.p28, ["query"]);
  await pull("p_m3_full",  W.m3,  ["page"]);
  await pull("p_r28_full", W.r28, ["page"]);
  await pull("p_p28_full", W.p28, ["page"]);
}
main().catch(e => { console.error("ERREUR", e?.response?.data?.error?.message || e.message); process.exit(1); });
