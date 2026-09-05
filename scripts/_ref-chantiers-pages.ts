import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-06-04", E = "2026-09-02";
const QUERIES = ["trouver des chantier peinture","trouver des chantiers peinture","trouver des chantier de peinture","trouver chantier peinture gratuit","comment trouver des chantiers de peinture"];
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  for (const q of QUERIES) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["page"], rowLimit: 20,
      dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "equals", expression: q }] }] } });
    console.log(`\n"${q}"`);
    for (const x of (r.data.rows||[])) console.log(`   pos ${(x.position||0).toFixed(1)} | ${x.impressions} imp | ${x.clicks} clics | ${x.keys![0]}`);
    if (!(r.data.rows||[]).length) console.log("   (aucune page)");
  }
  // Performance globale des 2 familles de pages PRO
  for (const pref of ["/trouver-des-chantiers/","/trouver-des-clients/"]) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["page"], rowLimit: 200,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: pref }] }] } });
    const rows = r.data.rows||[];
    console.log(`\n=== ${pref} : ${rows.length} pages avec >=1 impression | ${rows.reduce((a,x)=>a+(x.impressions||0),0)} imp | ${rows.reduce((a,x)=>a+(x.clicks||0),0)} clics (91 j) ===`);
    for (const x of rows.sort((a,b)=>(b.impressions||0)-(a.impressions||0)).slice(0,15))
      console.log(`   pos ${(x.position||0).toFixed(1).padStart(5)} | ${String(x.impressions).padStart(4)} imp | ${String(x.clicks).padStart(2)} clics | ${x.keys![0]}`);
  }
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
