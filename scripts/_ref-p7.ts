import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const tot = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: "2026-08-05", endDate: "2026-09-02" } });
  console.log("TOTAL site 05/08 -> 02/09 :", JSON.stringify(tot.data.rows));
  // fiches artisan des 10 zones denses : combien de clics ?
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
    startDate: "2026-08-05", endDate: "2026-09-02", dimensions: ["page"], rowLimit: 25000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }] } });
  const rows = r.data.rows||[];
  const dense = rows.filter(x=>/-paris|-lyon|-marseille|-lille|-bordeaux|-toulouse|-nice|-nantes|-montpellier|-rouen/.test(x.keys![0]));
  console.log(`fiches /artisan/ des 10 grandes villes : ${dense.length} pages, ${dense.reduce((a,x)=>a+(x.clicks||0),0)} clics, ${dense.reduce((a,x)=>a+(x.impressions||0),0)} impressions, position moyenne ${(dense.reduce((a,x)=>a+(x.position||0),0)/Math.max(dense.length,1)).toFixed(1)}`);
  const autres = rows.filter(x=>!dense.includes(x));
  console.log(`fiches /artisan/ ailleurs : ${autres.length} pages, ${autres.reduce((a,x)=>a+(x.clicks||0),0)} clics, position moyenne ${(autres.reduce((a,x)=>a+(x.position||0),0)/Math.max(autres.length,1)).toFixed(1)}`);
})();
