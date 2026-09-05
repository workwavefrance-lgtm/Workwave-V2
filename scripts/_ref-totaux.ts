import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const site = "https://workwave.fr/";
  const win = { startDate: "2026-08-05", endDate: "2026-09-01" };
  const t = await sc.searchanalytics.query({ siteUrl: site, requestBody: { ...win, dimensions: [] } });
  const row = (t.data.rows || [])[0];
  console.log("=== TOTAL SITE 28j (05/08 -> 01/09), SANS dimension ===");
  console.log(`  clics ${row?.clicks}  impressions ${row?.impressions}  CTR ${((row?.ctr||0)*100).toFixed(2)}%  position ${row?.position?.toFixed(1)}`);
  // dimension page, paginee
  let all: any[] = [], start = 0;
  while (true) {
    const r = await sc.searchanalytics.query({ siteUrl: site, requestBody: { ...win, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || [];
    if (rows.length === 0) break;
    all.push(...rows); start += rows.length;
    if (rows.length < 25000) break;
  }
  const cl = all.reduce((a, r) => a + (r.clicks || 0), 0), imp = all.reduce((a, r) => a + (r.impressions || 0), 0);
  console.log(`\n=== DIMENSION PAGE ===`);
  console.log(`  lignes ${all.length} | clics ${cl} (${(100*cl/(row?.clicks||1)).toFixed(1)}% du total) | imp ${imp} (${(100*imp/(row?.impressions||1)).toFixed(1)}% du total)`);
  console.log(`  impressions NON attribuees a une page : ${(row?.impressions||0) - imp} (${(100*((row?.impressions||0)-imp)/(row?.impressions||1)).toFixed(1)}%)`);
  const f = all.filter(r => r.keys![0].includes("/artisan/"));
  console.log(`\n  fiches /artisan/ avec >=1 impression : ${f.length}`);
  console.log(`  clics fiches : ${f.reduce((a,r)=>a+(r.clicks||0),0)} | imp fiches : ${f.reduce((a,r)=>a+(r.impressions||0),0)}`);
  console.log(`  fiches a 1 seule impression : ${f.filter(r=>r.impressions===1).length} (${(100*f.filter(r=>r.impressions===1).length/f.length).toFixed(1)}%)`);
})().catch(e => console.error("ERR", e.message));
