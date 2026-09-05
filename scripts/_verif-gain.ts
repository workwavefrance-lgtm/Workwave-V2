import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  // CTR reel des pages LISTING metier/ville (celles qui portent 75% de la base de gain)
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000 } });
  const rows = (r.data.rows||[]).filter(x=>{
    const p = x.keys![0].replace("https://workwave.fr","").split("?")[0];
    const seg = p.split("/").filter(Boolean);
    return seg.length===2 && !/^(guide-des-prix|blog|barometre|ai|en|pro|artisan)/.test(seg[0]) && !/-\d{2,3}$/.test(seg[1]);
  });
  console.log(`=== CTR REEL pages LISTING /[metier]/[ville] (${rows.length} pages) ===`);
  for (const [a,b] of [[1,4],[4,6],[6,11],[11,21]]) {
    const s = rows.filter(x=>x.position!>=a && x.position!<b);
    const i = s.reduce((y,x)=>y+x.impressions!,0), c = s.reduce((y,x)=>y+x.clicks!,0);
    if (i) console.log(`   pos ${String(a).padStart(2)}-${String(b-1).padStart(2)} : ${String(s.length).padStart(4)} pages ${String(i).padStart(6)} imp ${String(c).padStart(4)} clics  CTR ${(100*c/i).toFixed(2)}%`);
  }
  console.log(`\n=== GAIN CORRIGE (base 2370 imp nommees pos<=30, 28j) ===`);
  const BASE = 2370, LOCAL = 0.752, INFO = 0.246;
  const scen = [
    ["Hypothese de l audit (8% partout)", 0.08, 0.08],
    ["CTR mesure guides pos4-10 (0,82%) / listings pos4-5", 0.0082, null],
  ];
  const ctrListing4 = rows.filter(x=>x.position!>=4&&x.position!<6);
  const cl4 = ctrListing4.reduce((y,x)=>y+x.clicks!,0)/Math.max(1,ctrListing4.reduce((y,x)=>y+x.impressions!,0));
  console.log(`   CTR listing mesure pos 4-5 : ${(100*cl4).toFixed(2)}%`);
  console.log(`   Audit      : ${BASE}*0.08/28              = ${(BASE*0.08/28).toFixed(1)} clics/j`);
  console.log(`   Corrige    : (${BASE}*${INFO}*0.0082 + ${BASE}*${LOCAL}*${cl4.toFixed(4)})/28 = ${((BASE*INFO*0.0082 + BASE*LOCAL*cl4)/28).toFixed(2)} clics/j`);
  console.log(`   Plafond genereux (2,41% = CTR site pos 4, tout confondu) : ${(BASE*0.0241/28).toFixed(2)} clics/j`);
  console.log(`   Meme plafond corrige de l anonymisation (x1,98 couverture guides) : ${(BASE*0.0241*1.98/28).toFixed(2)} clics/j`);
}
main().catch(e=>console.error("ERR", e.message));
