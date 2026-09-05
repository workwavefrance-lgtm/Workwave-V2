import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const P = { startDate: "2026-06-04", endDate: "2026-09-02" };
  const F = [{dimension:"page",operator:"equals",expression:"https://workwave.fr/pro"}];

  const rPage = await sc.searchanalytics.query({ siteUrl: SITE, requestBody:
    { ...P, dimensions:["page"], rowLimit: 5, dimensionFilterGroups:[{filters:F}] }});
  const p = (rPage.data.rows||[])[0];
  const totImp = p?.impressions||0, totClic = p?.clicks||0;

  const rQ = await sc.searchanalytics.query({ siteUrl: SITE, requestBody:
    { ...P, dimensions:["query"], rowLimit: 500, dimensionFilterGroups:[{filters:F}] }});
  const rows = rQ.data.rows||[];
  let qImp=0, qClic=0, brandImp=0, brandClic=0;
  for (const r of rows) {
    const k=(r.keys||[])[0]||""; qImp+=r.impressions||0; qClic+=r.clicks||0;
    if (/work\s?wave/i.test(k)) { brandImp+=r.impressions||0; brandClic+=r.clicks||0; }
  }
  console.log("=== /pro, 04/06 -> 02/09/2026 ===");
  console.log(`TOTAL page      : ${totImp} imp, ${totClic} clics, CTR ${(100*totClic/totImp).toFixed(2)}%`);
  console.log(`Somme requetes  : ${qImp} imp (${(100*qImp/totImp).toFixed(1)}% du total), ${qClic} clics (${(100*qClic/totClic).toFixed(1)}% du total)`);
  console.log(`NON ATTRIBUE    : ${totImp-qImp} imp (${(100*(totImp-qImp)/totImp).toFixed(1)}%), ${totClic-qClic} clics (${(100*(totClic-qClic)/totClic).toFixed(1)}%)`);
  console.log(`Requetes marque : ${brandImp} imp, ${brandClic} clics, CTR marque visible ${(100*brandClic/brandImp).toFixed(2)}%`);
  console.log(`Ratio 17/88 (clics page / imp de "workwave") = ${(100*totClic/88).toFixed(1)}%  <- reconstitution du "20% CTR"`);
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
