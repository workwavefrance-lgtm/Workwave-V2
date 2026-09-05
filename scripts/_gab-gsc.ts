import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  // 1. requetes position 8-20, triees par impressions
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 1000 } });
  const rows = (r.data.rows||[]).filter(x => (x.position||0) >= 8 && (x.position||0) <= 20);
  rows.sort((a,b)=> (b.impressions||0)-(a.impressions||0));
  console.log("=== REQUETES POSITION 8-20 (top 40 par impressions, 05/08-01/09) ===");
  for (const x of rows.slice(0,40)) console.log(`pos ${(x.position||0).toFixed(1).padStart(5)} | imp ${String(x.impressions).padStart(5)} | clics ${String(x.clicks).padStart(3)} | ${x.keys?.[0]}`);
  console.log(`\n(total requetes en 8-20 : ${rows.length})`);
}
main().catch(e=>console.error(e.message));
