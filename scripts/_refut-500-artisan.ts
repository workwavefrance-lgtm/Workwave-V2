import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const site = "https://workwave.fr/";
  const start = "2026-08-07", end = "2026-09-03";

  const tot = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: start, endDate: end, dimensions: [] } });
  const t = tot.data.rows?.[0];
  console.log(`TOTAL SITE ${start} -> ${end} : ${t?.clicks} clics, ${t?.impressions} impressions`);

  const art = await sc.searchanalytics.query({
    siteUrl: site,
    requestBody: {
      startDate: start, endDate: end, dimensions: [],
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }],
    },
  });
  const a = art.data.rows?.[0];
  console.log(`FICHES /artisan/      : ${a?.clicks} clics, ${a?.impressions} impressions`);
  const jours = 28;
  console.log(`  -> ${((a?.clicks || 0) / jours).toFixed(2)} clic/jour venant des fiches (site entier : ${((t?.clicks || 0) / jours).toFixed(1)})`);

  const pages = await sc.searchanalytics.query({
    siteUrl: site,
    requestBody: {
      startDate: start, endDate: end, dimensions: ["page"], rowLimit: 25000,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }],
    },
  });
  const rows = pages.data.rows || [];
  const avecClic = rows.filter((r) => (r.clicks || 0) > 0);
  console.log(`Fiches avec >=1 impression sur 28 j : ${rows.length}`);
  console.log(`Fiches avec >=1 CLIC sur 28 j       : ${avecClic.length}`);
  const totalClicsFiches = rows.reduce((s, r) => s + (r.clicks || 0), 0);
  console.log(`Clics totaux fiches (somme pages)   : ${totalClicsFiches}`);
  console.log(`Clic/fiche/jour parmi celles QUI ONT des impressions : ${(totalClicsFiches / rows.length / jours).toFixed(5)}`);
})();
