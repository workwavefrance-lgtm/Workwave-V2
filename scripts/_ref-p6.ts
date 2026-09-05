import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  // rendement reel d une fiche /artisan/ sur 28 jours
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
    startDate: "2026-08-05", endDate: "2026-09-02", dimensions: ["page"], rowLimit: 25000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }] } });
  const rows = r.data.rows||[];
  const c = rows.reduce((a,x)=>a+(x.clicks||0),0), i = rows.reduce((a,x)=>a+(x.impressions||0),0);
  console.log(`/artisan/ : ${rows.length} pages avec impressions, ${c} clics, ${i} impressions sur 29 j = ${(c/29).toFixed(1)} clic/jour pour 2,44 M de fiches`);
  console.log(`  rendement par fiche EXISTANTE : ${(c/29/2439976).toExponential(2)} clic/jour/fiche`);
  console.log(`  -> 37 270 fiches ajoutees (plombier, 10 depts denses) rapporteraient ${(37270*c/29/2439976).toFixed(3)} clic/jour au meme rendement`);
  // /plombier/paris sur 90 jours
  const r2 = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
    startDate: "2026-06-05", endDate: "2026-09-02", dimensions: ["page"], rowLimit: 10,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/plombier/paris" }] }] } });
  console.log("\n/plombier/paris* sur 90 jours :", JSON.stringify(r2.data.rows||[]));
})();
