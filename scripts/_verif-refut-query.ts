import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const W = { s: "2026-08-05", e: "2026-09-01" };

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const q = (body: any) => sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: W.s, endDate: W.e, type: "web", ...body } });

  // A. Total sans dimension
  const t = (await q({})).data.rows?.[0];
  console.log(`A. TOTAL sans dimension : ${t?.clicks} clics, ${t?.impressions} impressions`);

  // A bis. Somme par date (doit egaler le total)
  const d = (await q({ dimensions: ["date"], rowLimit: 25000 })).data.rows || [];
  console.log(`A bis. Somme dimension DATE (${d.length} jours) : ${d.reduce((a,r)=>a+(r.clicks||0),0)} clics, ${d.reduce((a,r)=>a+(r.impressions||0),0)} impressions`);

  // B. Query full
  let all: any[] = [], startRow = 0;
  while (true) {
    const rows = (await q({ dimensions: ["query"], rowLimit: 25000, startRow })).data.rows || [];
    all.push(...rows);
    console.log(`   query page startRow=${startRow} -> ${rows.length} lignes`);
    if (rows.length < 25000) break; startRow += rows.length;
  }
  console.log(`B. QUERY : ${all.length} lignes, ${all.reduce((a,r)=>a+(r.clicks||0),0)} clics, ${all.reduce((a,r)=>a+(r.impressions||0),0)} impressions`);
  const after = (await q({ dimensions: ["query"], rowLimit: 25000, startRow: all.length })).data.rows || [];
  console.log(`B bis. startRow=${all.length} -> ${after.length} lignes (0 = fin reelle des donnees)`);

  // C. Page : y a-t-il des lignes au dela de 89618 ?
  const pAfter = (await q({ dimensions: ["page"], rowLimit: 25000, startRow: 89618 })).data.rows || [];
  console.log(`C. PAGE startRow=89618 -> ${pAfter.length} lignes`);

  // D. Un seul jour : total sans dimension VS somme dimension page (test de troncature)
  for (const day of ["2026-08-26", "2026-09-01"]) {
    const tt = (await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: day, endDate: day, type: "web" } })).data.rows?.[0];
    let pAll: any[] = [], sr = 0;
    while (true) {
      const rows = (await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: day, endDate: day, dimensions: ["page"], rowLimit: 25000, startRow: sr, type: "web" } })).data.rows || [];
      pAll.push(...rows); if (rows.length < 25000) break; sr += rows.length;
    }
    let qAll: any[] = [], sr2 = 0;
    while (true) {
      const rows = (await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: day, endDate: day, dimensions: ["query"], rowLimit: 25000, startRow: sr2, type: "web" } })).data.rows || [];
      qAll.push(...rows); if (rows.length < 25000) break; sr2 += rows.length;
    }
    console.log(`D. ${day} : total ${tt?.clicks} clics / ${tt?.impressions} imp | PAGE ${pAll.length} lignes ${pAll.reduce((a,r)=>a+(r.clicks||0),0)} clics ${pAll.reduce((a,r)=>a+(r.impressions||0),0)} imp | QUERY ${qAll.length} lignes ${qAll.reduce((a,r)=>a+(r.clicks||0),0)} clics ${qAll.reduce((a,r)=>a+(r.impressions||0),0)} imp`);
  }
}
main().catch(e => { console.error("ERREUR", e?.response?.data?.error?.message || e.message); process.exit(1); });
