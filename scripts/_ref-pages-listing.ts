import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-07", E = "2026-09-03";
  let all: any[] = [];
  for (let start = 0; start < 25000; start += 5000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 5000, startRow: start } });
    const rows = r.data.rows || [];
    all.push(...rows);
    if (rows.length < 5000) break;
  }
  const totImp = all.reduce((s,x)=>s+(x.impressions||0),0);
  const totCli = all.reduce((s,x)=>s+(x.clicks||0),0);
  console.log(`TOTAL GSC ${S} -> ${E} : ${all.length} pages, ${totImp} impressions, ${totCli} clics`);
  // pattern /[metier]/[ville] : exactement 2 segments, 2e segment PAS -NN (dept)
  const listing = all.filter(x => {
    const u = new URL(x.keys![0]);
    const seg = u.pathname.split("/").filter(Boolean);
    if (seg.length !== 2) return false;
    if (/-\d{2,3}$/.test(seg[1])) return false; // departement
    const exclus = ["artisan","guide-des-prix","trouver-des-chantiers","trouver-des-clients","blog","ai","en","pro","barometre"];
    if (exclus.includes(seg[0])) return false;
    return true;
  });
  const li = listing.reduce((s,x)=>s+(x.impressions||0),0);
  const lc = listing.reduce((s,x)=>s+(x.clicks||0),0);
  console.log(`PAGES /[metier]/[ville] : ${listing.length} pages, ${li} impressions (${(100*li/totImp).toFixed(1)}% du total), ${lc} clics (${(100*lc/totCli).toFixed(1)}%)`);
  listing.sort((a,b)=>(b.impressions||0)-(a.impressions||0));
  console.log("\n--- top 25 ---");
  for (const x of listing.slice(0,25)) console.log(`imp ${String(x.impressions).padStart(5)} clics ${String(x.clicks).padStart(3)} pos ${(x.position||0).toFixed(1).padStart(5)} ${new URL(x.keys![0]).pathname}`);
  // export
  const fs = await import("fs");
  fs.writeFileSync("/tmp/listing-pages.json", JSON.stringify(listing.map(x=>({p:new URL(x.keys![0]).pathname,i:x.impressions,c:x.clicks,pos:x.position}))));
  console.log("\n-> /tmp/listing-pages.json");
}
main().catch(e=>console.error(e.message));
