import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  // Combien de PAGES distinctes rapportent au moins 1 clic, et combien de clics au total
  const r = await sc.searchanalytics.query({
    siteUrl: "https://workwave.fr/",
    requestBody: { startDate: "2026-08-05", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 25000 },
  });
  const rows = r.data.rows || [];
  const clics = rows.reduce((s, x) => s + (x.clicks || 0), 0);
  const imps = rows.reduce((s, x) => s + (x.impressions || 0), 0);
  const avecClic = rows.filter((x) => (x.clicks || 0) > 0).length;
  console.log("Fenetre 05/08 -> 03/09 (30 jours)");
  console.log("  pages distinctes avec impressions :", rows.length);
  console.log("  pages distinctes avec >=1 clic    :", avecClic);
  console.log("  clics totaux    :", clics, " => par jour :", (clics / 30).toFixed(1));
  console.log("  impressions tot :", imps);
  console.log("  clics / page indexee (186000) / jour :", (clics / 30 / 186000).toFixed(6));
  console.log("  clics / page AYANT des impressions / jour :", (clics / 30 / rows.length).toFixed(5));
})();
