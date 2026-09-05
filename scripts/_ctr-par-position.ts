import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let all: any[] = [];
  for (let s=0; s<75000; s+=25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate:"2026-06-04", endDate:"2026-09-02", dimensions:["query"], rowLimit:25000, startRow:s } });
    const rows = r.data.rows||[]; all.push(...rows); if (rows.length<25000) break;
  }
  const bandes = [[1,3],[3,5],[5,10],[10,20],[20,50],[50,200]];
  console.log("CTR MESURE DE WORKWAVE.FR PAR BANDE DE POSITION (3 mois, 46 830 requetes)");
  for (const [a,b] of bandes) {
    const g = all.filter(r=>(r.position||0)>=a && (r.position||0)<b);
    const i = g.reduce((x,y)=>x+(y.impressions||0),0), c = g.reduce((x,y)=>x+(y.clicks||0),0);
    console.log(`  pos ${String(a).padStart(3)}-${String(b).padStart(3)} : ${String(i).padStart(7)} imp | ${String(c).padStart(4)} clics | CTR ${(100*c/(i||1)).toFixed(2)}%`);
  }
}
main().catch(e=>console.error("ERR", e.message));
