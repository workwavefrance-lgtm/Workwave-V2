import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-06-04", E = "2026-09-02";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const pages = ["https://workwave.fr/trouver-des-chantiers/vienne-86","https://workwave.fr/trouver-des-chantiers/peintre","https://workwave.fr/trouver-des-chantiers/cuisiniste","https://workwave.fr/trouver-des-chantiers/architecte","https://workwave.fr/trouver-des-chantiers/pisciniste"];
  for (const p of pages) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["query"], rowLimit: 50,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "equals", expression: p }] }] } });
    console.log(`\n${p}`);
    for (const x of (r.data.rows||[])) console.log(`   pos ${(x.position||0).toFixed(1).padStart(5)} | ${String(x.impressions).padStart(3)} imp | ${x.clicks} clics | ${x.keys![0]}`);
    if(!(r.data.rows||[]).length) console.log("   (aucune requete)");
  }
  // CTR mesure de TOUT le site par tranche de position, pour tester l'hypothese "pos 10 => 0,18%"
  const all: any[] = [];
  for (let start = 0; start < 100000; start += 25000) {
    const rr = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000, startRow: start } });
    const q = rr.data.rows || []; all.push(...q); if (q.length < 25000) break;
  }
  const tr = [[1,3],[3,5],[5,8],[8,11],[11,15],[15,21],[21,31]];
  console.log(`\n=== CTR REEL du site par tranche de position (91 j, ${all.length} requetes) ===`);
  for (const [a,b] of tr) {
    const s = all.filter(x=>(x.position||0)>=a && (x.position||0)<b);
    const i = s.reduce((t,x)=>t+(x.impressions||0),0), c = s.reduce((t,x)=>t+(x.clicks||0),0);
    console.log(`  pos ${a}-${b-1} : ${String(i).padStart(6)} imp | ${String(c).padStart(4)} clics | CTR ${(100*c/(i||1)).toFixed(2)} %`);
  }
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
