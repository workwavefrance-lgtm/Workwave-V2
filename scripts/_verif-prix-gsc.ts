import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const RX = /\bprix\b|\btarif|combien (ca|ça) co|coût|au m2|au m²/i;

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";

  // 1) requetes fraiches
  let rows: any[] = [];
  for (let start = 0; start < 25000; start += 5000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["query"], rowLimit: 5000, startRow: start } });
    const got = r.data.rows || [];
    rows.push(...got);
    if (got.length < 5000) break;
  }
  const prix = rows.filter(r => RX.test(r.keys![0]));
  const imp = prix.reduce((a,r)=>a+r.impressions!,0), cl = prix.reduce((a,r)=>a+r.clicks!,0);
  console.log(`FRAIS ${S}->${E} : total nomme ${rows.length} req, ${rows.reduce((a,r)=>a+r.impressions!,0)} imp, ${rows.reduce((a,r)=>a+r.clicks!,0)} clics`);
  console.log(`  requetes PRIX : ${prix.length} req | ${imp} imp | ${cl} clics | pos ${(prix.reduce((a,r)=>a+r.position!*r.impressions!,0)/imp).toFixed(1)}`);

  // 2) total site (avec anonymisees) pour mesurer le taux d anonymisation
  const tot = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: [] } });
  const t = tot.data.rows?.[0];
  console.log(`  TOTAL SITE (anonymisees incluses) : ${t?.impressions} imp | ${t?.clicks} clics`);
  console.log(`  part nommee : imp ${(100*rows.reduce((a,r)=>a+r.impressions!,0)/(t?.impressions||1)).toFixed(1)}% | clics ${(100*rows.reduce((a,r)=>a+r.clicks!,0)/(t?.clicks||1)).toFixed(1)}%`);

  // 3) pages /guide-des-prix/
  const g = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: S, endDate: E, dimensions: ["page"], rowLimit: 5000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/guide-des-prix/" }] }] } });
  const gr = g.data.rows || [];
  console.log(`\n/guide-des-prix/ : ${gr.length} pages | ${gr.reduce((a,r)=>a+r.impressions!,0)} imp | ${gr.reduce((a,r)=>a+r.clicks!,0)} clics | pos ${(gr.reduce((a,r)=>a+r.position!*r.impressions!,0)/gr.reduce((a,r)=>a+r.impressions!,0)).toFixed(1)}`);

  // 4) CTR REEL mesure par position sur NOTRE site (toutes requetes nommees)
  console.log(`\n=== CTR REEL par position (toutes requetes nommees, ${S}->${E}) ===`);
  for (const [a,b] of [[1,2],[2,3],[3,4],[4,5],[5,7],[7,11],[11,21]]) {
    const s = rows.filter(r=>r.position!>=a && r.position!<b);
    const i = s.reduce((x,r)=>x+r.impressions!,0), c = s.reduce((x,r)=>x+r.clicks!,0);
    if (i) console.log(`  pos ${a}-${b-1} : ${String(i).padStart(6)} imp ${String(c).padStart(4)} clics  CTR ${(100*c/i).toFixed(2)}%`);
  }
}
main().catch(e=>console.error("ERR", e.message));
