import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-05", E = "2026-09-01"; // memes 28 jours que l audit

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });

  // 1) TOTAL SITE (aucune dimension) = verite absolue
  const tot = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E } });
  const t = (tot.data.rows || [])[0];
  console.log("=== 1. TOTAL SITE 28j (05/08 -> 01/09), sans dimension ===");
  console.log(`   ${t?.impressions} impressions | ${t?.clicks} clics | CTR ${(100*(t?.ctr||0)).toFixed(2)}% | pos ${(t?.position||0).toFixed(1)}`);

  // 2) TOTAL par dimension QUERY (anonymisation active)
  const byq = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000 } });
  const qr = byq.data.rows || [];
  console.log("\n=== 2. Meme periode, dimension QUERY ===");
  console.log(`   ${qr.length} requetes nommees | ${qr.reduce((a,r)=>a+(r.impressions||0),0)} imp | ${qr.reduce((a,r)=>a+(r.clicks||0),0)} clics`);

  // 3) TOTAL par dimension PAGE (pas d anonymisation)
  let pages: any[] = [], start = 0;
  while (true) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || [];
    if (!rows.length) break;
    pages.push(...rows); start += rows.length;
    if (rows.length < 25000) break;
  }
  console.log("\n=== 3. Meme periode, dimension PAGE ===");
  console.log(`   ${pages.length} pages | ${pages.reduce((a,r)=>a+(r.impressions||0),0)} imp | ${pages.reduce((a,r)=>a+(r.clicks||0),0)} clics`);

  require("fs").writeFileSync("/private/tmp/gsc/REF_pages.json", JSON.stringify(pages));
}
main().catch(e => console.error("ERREUR", e.message));
