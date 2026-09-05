import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  let all: any[] = [];
  for (let start = 0; start < 75000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || [];
    all.push(...rows);
    if (rows.length < 25000) break;
  }
  console.log(`total requetes recuperees : ${all.length}`);
  const p820 = all.filter(x => (x.position||0) >= 8 && (x.position||0) <= 20);
  p820.sort((a,b)=> (b.impressions||0)-(a.impressions||0));
  console.log(`requetes en position 8-20 : ${p820.length} | impressions cumulees : ${p820.reduce((s,x)=>s+(x.impressions||0),0)} | clics cumules : ${p820.reduce((s,x)=>s+(x.clicks||0),0)}`);
  console.log("\n=== TOP 30 par impressions ===");
  for (const x of p820.slice(0,30)) console.log(`pos ${(x.position||0).toFixed(1).padStart(5)} | imp ${String(x.impressions).padStart(5)} | clics ${String(x.clicks).padStart(3)} | ${x.keys?.[0]}`);
  // requetes generiques metier+ville (2-4 mots, sans nom propre d entreprise) - heuristique
  console.log("\n=== TOP 30 impressions toutes positions ===");
  const byImp = [...all].sort((a,b)=>(b.impressions||0)-(a.impressions||0));
  for (const x of byImp.slice(0,30)) console.log(`pos ${(x.position||0).toFixed(1).padStart(5)} | imp ${String(x.impressions).padStart(5)} | clics ${String(x.clicks).padStart(3)} | ${x.keys?.[0]}`);
}
main().catch(e=>console.error(e.message));
