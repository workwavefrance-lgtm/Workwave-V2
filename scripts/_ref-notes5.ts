import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const all: any[] = [];
  for (let start = 0; start < 100000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
  }
  const listings = all.filter(r => {
    const p = (r.keys![0] as string).replace("https://workwave.fr","");
    const seg = p.split("/").filter(Boolean);
    return seg.length === 2 && !/-\d{2,3}$/.test(seg[1]) &&
      !["artisan","guide-des-prix","blog","trouver-des-chantiers","trouver-des-clients","ai","en"].includes(seg[0]);
  }).sort((a,b)=>(b.impressions||0)-(a.impressions||0));

  const tot = listings.reduce((n,r)=>n+(r.impressions||0),0);
  console.log("pages /[metier]/[ville] avec impressions :", listings.length, "| impressions 28j :", tot);
  let cum = 0;
  for (const seuil of [0.5, 0.8, 0.9]) {
    cum = 0; let k = 0;
    for (const r of listings) { cum += r.impressions||0; k++; if (cum >= tot*seuil) break; }
    console.log(`  ${(seuil*100).toFixed(0)}% des impressions viennent de ${k} pages (${(100*k/listings.length).toFixed(1)}% des pages)`);
  }
  // position moyenne ponderee du top 1000
  const top = listings.slice(0, 1000);
  const ti = top.reduce((n,r)=>n+(r.impressions||0),0);
  const tp = top.reduce((n,r)=>n+(r.position||0)*(r.impressions||0),0)/Math.max(ti,1);
  const tc = top.reduce((n,r)=>n+(r.clicks||0),0);
  console.log(`\n  top 1000 pages : ${ti} impr (${(100*ti/tot).toFixed(0)}% du total), ${tc} clics, CTR ${(100*tc/ti).toFixed(2)}%, position moyenne ${tp.toFixed(1)}`);
  // part des impressions en position <= 10 (la seule ou une etoile se voit)
  let iTop10 = 0, cTop10 = 0;
  for (const r of listings) if ((r.position||99) <= 10) { iTop10 += r.impressions||0; cTop10 += r.clicks||0; }
  console.log(`  impressions en position <= 10 : ${iTop10} (${(100*iTop10/tot).toFixed(1)}% du total), ${cTop10} clics, CTR ${(100*cTop10/Math.max(iTop10,1)).toFixed(2)}%`);
}
main().catch(e=>console.error(e.message));
