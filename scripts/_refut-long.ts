import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
    startDate: "2025-09-04", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 500,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/trouver-des-" }] }],
  }});
  let ic=0, cc=0, n=0;
  for (const row of (r.data.rows||[])) {
    const p = (row.keys as string[])[0].replace("https://workwave.fr","");
    const enfant = p.split("/").length > 2;
    if (enfant) { ic += row.impressions||0; cc += row.clicks||0; n++; }
    console.log(`${enfant?"ENFANT":"HUB   "} | ${String(row.impressions).padStart(5)} imp | ${String(row.clicks).padStart(3)} clics | ${p}`);
  }
  console.log(`\nENFANTS sur 12 mois : ${n} pages, ${ic} impressions, ${cc} CLICS`);
})().catch(e=>console.error(e.message));
