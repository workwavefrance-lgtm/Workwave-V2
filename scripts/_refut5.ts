import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-04", E = "2026-08-31";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let pages: any[] = [], start = 0;
  while (true) {
    const r = (await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }] } })).data.rows || [];
    pages = pages.concat(r); if (r.length < 25000) break; start += 25000;
  }
  pages.sort((a,b)=> (b.clicks||0)-(a.clicks||0));
  const tot = pages.reduce((a,r)=>a+(r.clicks||0),0);
  const n = pages.length;
  const cum = (k:number)=> pages.slice(0,k).reduce((a,r)=>a+(r.clicks||0),0);
  console.log(`fiches vues: ${n}, clics: ${tot}`);
  for (const p of [0.01,0.05,0.10,0.25,0.50]) {
    const k = Math.round(n*p);
    console.log(`  top ${(p*100).toFixed(0)}% des fiches (${k}) = ${cum(k)} clics (${(100*cum(k)/tot).toFixed(1)}%)`);
  }
  // taux marginal : la moitie basse
  const moitieBasse = tot - cum(Math.round(n*0.5));
  console.log(`  moitie BASSE (${n-Math.round(n*0.5)} fiches) = ${moitieBasse} clics -> ${(moitieBasse/(n/2)/28).toFixed(6)} clic/jour/fiche`);
  console.log(`  moyenne globale = ${(tot/n/28).toFixed(6)} clic/jour/fiche`);
}
main().catch(e=>console.log("ERR", e.message));
