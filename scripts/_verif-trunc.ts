import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  let all: any[] = [];
  for (let start = 0; start < 100000; start += 5000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["page"], rowLimit: 5000, startRow: start } });
    const got = r.data.rows || [];
    all.push(...got);
    if (got.length < 5000) break;
  }
  console.log(`Pages totales renvoyees (paginees) : ${all.length}`);
  console.log(`  imp ${all.reduce((a,r)=>a+r.impressions!,0)} | clics ${all.reduce((a,r)=>a+r.clicks!,0)}`);
  const L = all.filter(x=>{ const p=x.keys![0].replace("https://workwave.fr","").split("?")[0]; const s=p.split("/").filter(Boolean);
    return s.length===2 && !/^(guide-des-prix|blog|barometre|ai|en|pro|artisan)/.test(s[0]) && !/-\d{2,3}$/.test(s[1]); });
  console.log(`\nLISTINGS /[metier]/[ville] complets : ${L.length} pages | ${L.reduce((a,r)=>a+r.impressions!,0)} imp | ${L.reduce((a,r)=>a+r.clicks!,0)} clics | CTR ${(100*L.reduce((a,r)=>a+r.clicks!,0)/L.reduce((a,r)=>a+r.impressions!,0)).toFixed(2)}%`);
  for (const [a,b] of [[1,4],[4,6],[6,11],[11,21],[21,999]]) {
    const s = L.filter(x=>x.position!>=a && x.position!<b);
    const i = s.reduce((y,x)=>y+x.impressions!,0), c = s.reduce((y,x)=>y+x.clicks!,0);
    if (i) console.log(`   pos ${String(a).padStart(2)}-${String(b-1).padStart(3)} : ${String(s.length).padStart(5)} pages ${String(i).padStart(7)} imp ${String(c).padStart(5)} clics  CTR ${(100*c/i).toFixed(2)}%`);
  }
}
main().catch(e=>console.error("ERR", e.message));
