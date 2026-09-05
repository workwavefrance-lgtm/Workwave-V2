import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
    startDate: "2026-08-05", endDate: "2026-09-02", dimensions: ["page"], rowLimit: 25000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/plombier/" }] }] } });
  const rows = (r.data.rows||[]).filter(x=>/paris|lyon|marseille|lille|bordeaux|toulouse|nice|nantes|montpellier|rouen|rhone-69|bouches|nord-59|gironde|haute-garonne|alpes-maritimes|loire-atlantique|herault|seine-maritime/.test(x.keys![0]));
  rows.sort((a,b)=>(b.impressions||0)-(a.impressions||0));
  console.log("pages plombier des 10 zones denses, 05/08 -> 02/09 :");
  let c=0,i=0;
  for (const x of rows) { c+=x.clicks||0; i+=x.impressions||0; console.log(`  ${String(x.impressions).padStart(5)} imp ${String(x.clicks).padStart(3)} clics pos ${(x.position||0).toFixed(1).padStart(5)}  ${x.keys![0].replace("https://workwave.fr","")}`); }
  console.log(`TOTAL ${rows.length} pages : ${c} clics, ${i} impressions sur 29 jours = ${(c/29).toFixed(2)} clic/jour`);
})();
