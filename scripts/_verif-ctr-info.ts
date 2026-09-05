import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  const pull = async (contains: string) => {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["page"], rowLimit: 5000,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: contains }] }] } });
    return r.data.rows || [];
  };
  for (const seg of ["/guide-des-prix/", "/blog/", "/barometre"]) {
    const rows = await pull(seg);
    console.log(`\n=== ${seg} : ${rows.length} pages, CTR reel par position ===`);
    for (const [a,b] of [[1,4],[4,6],[6,11],[11,21],[21,999]]) {
      const s = rows.filter(r=>r.position!>=a && r.position!<b);
      const i = s.reduce((x,r)=>x+r.impressions!,0), c = s.reduce((x,r)=>x+r.clicks!,0);
      if (i) console.log(`   pos ${String(a).padStart(2)}-${String(b-1).padStart(3)} : ${String(s.length).padStart(3)} pages ${String(i).padStart(5)} imp ${String(c).padStart(3)} clics  CTR ${(100*c/i).toFixed(2)}%`);
    }
    const best = [...rows].filter(r=>r.position!<=10).sort((a,b)=>b.impressions!-a.impressions!).slice(0,5);
    if (best.length) { console.log(`   meilleures pages (pos<=10) :`);
      for (const r of best) console.log(`     pos ${r.position!.toFixed(1).padStart(4)} ${String(r.impressions).padStart(4)}i ${String(r.clicks).padStart(2)}c  ${r.keys![0].replace("https://workwave.fr","")}`); }
  }
  // guide-des-prix : 28j precedents pour verifier le -59%
  const prev = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: "2026-07-08", endDate: "2026-08-04", dimensions: ["page"], rowLimit: 5000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/guide-des-prix/" }] }] } });
  const pr = prev.data.rows || [];
  console.log(`\n/guide-des-prix/ 28j PRECEDENTS (08/07-04/08) : ${pr.length} pages | ${pr.reduce((a,r)=>a+r.impressions!,0)} imp | ${pr.reduce((a,r)=>a+r.clicks!,0)} clics`);
}
main().catch(e=>console.error("ERR", e.message));
