import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-01", E = "2026-08-31";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  // pagination complete sur la dimension page
  const all: any[] = [];
  for (let start = 0; start < 200000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || [];
    all.push(...rows);
    if (rows.length < 25000) break;
  }
  console.log(`pages totales remontees (paginees) : ${all.length}`);
  let dc=0, di=0, dn=0, dps=0;
  for (const row of all) {
    const p = row.keys![0].replace("https://workwave.fr","").split("?")[0];
    const seg = p.split("/").filter(Boolean);
    if (seg.length === 2 && /-\d{2,3}$/.test(seg[1])) { dn++; dc+=row.clicks||0; di+=row.impressions||0; dps+=(row.position||0)*(row.impressions||0); }
  }
  console.log(`/[metier]/[dept] REEL : ${dn} pages | ${di} impressions | ${dc} clics | pos moy ${(dps/Math.max(di,1)).toFixed(1)}`);
  console.log(`  impressions par page : ${(di/Math.max(dn,1)).toFixed(2)}`);
  console.log(`  clics par page       : ${(dc/Math.max(dn,1)).toFixed(3)}`);
  console.log(`  CTR famille          : ${(100*dc/Math.max(di,1)).toFixed(2)}%`);
  // distribution
  const imps = all.filter(r=>{const p=r.keys![0].replace("https://workwave.fr","").split("?")[0];const s=p.split("/").filter(Boolean);return s.length===2&&/-\d{2,3}$/.test(s[1]);}).map(r=>r.impressions||0).sort((a,b)=>b-a);
  console.log(`  mediane imp/page : ${imps[Math.floor(imps.length/2)]} | top10 : ${imps.slice(0,10).join(",")}`);
  console.log(`  pages dept a 0 clic : ${all.filter(r=>{const p=r.keys![0].replace("https://workwave.fr","").split("?")[0];const s=p.split("/").filter(Boolean);return s.length===2&&/-\d{2,3}$/.test(s[1])&&(r.clicks||0)===0;}).length}`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
