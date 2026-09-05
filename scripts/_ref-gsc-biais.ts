import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-05", E = "2026-09-01";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  // EXACTEMENT la requete de _gab-gsc5.ts : rowLimit 25000, AUCUNE pagination
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000 } });
  const rows = (r.data.rows||[]).filter(x => !/\/artisan\/|\/guide-des-prix\/|\/blog\/|\/ai\/|\/en\//.test(x.keys![0]));
  const b: Record<string, number[]> = { "1-3":[0,0], "4-10":[0,0], "11-20":[0,0], "21+":[0,0] };
  for (const x of rows) { const p=x.position||0; const k = p<=3?"1-3":p<=10?"4-10":p<=20?"11-20":"21+"; b[k][0]+=x.impressions||0; b[k][1]+=x.clicks||0; }
  console.log(`Requete SANS pagination : ${r.data.rows?.length} lignes rendues, ${rows.length} apres filtre`);
  const zero = (r.data.rows||[]).filter(x=>(x.clicks||0)===0).length;
  console.log(`dont lignes a 0 clic dans la page rendue : ${zero}`);
  for (const [k,[i,c]] of Object.entries(b)) console.log(`  pos ${k.padEnd(6)} : ${String(i).padStart(7)} impr | ${String(c).padStart(5)} clics | CTR ${(100*c/Math.max(i,1)).toFixed(2)}%`);
}
main().catch(e=>console.error(e.message));
