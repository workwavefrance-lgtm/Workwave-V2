import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const q = async (expr: string) => {
    const r = await sc.searchanalytics.query({
      siteUrl: "https://workwave.fr/",
      requestBody: {
        startDate: "2026-08-05", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 5000,
        dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: expr }] }],
      },
    });
    const rows = r.data.rows || [];
    const c = rows.reduce((s, x) => s + (x.clicks || 0), 0);
    const i = rows.reduce((s, x) => s + (x.impressions || 0), 0);
    console.log(`  ${expr.padEnd(26)} : ${rows.length} URL, ${c} clics (${(c/30).toFixed(2)}/j), ${i} imp`);
    return { n: rows.length, c, i };
  };
  console.log("PAGES DE TYPE HUB / INDEX deja en ligne, 30 jours :");
  await q("/departements");
  await q("/barometre");
  await q("/trouver-des-chantiers");
  await q("/guide-des-prix/");
  await q("/verifier-artisan");
  await q("/recherche");
  console.log("\nPAGES RACINE METIER (1 segment) : mesure separee");
  const r = await sc.searchanalytics.query({
    siteUrl: "https://workwave.fr/",
    requestBody: { startDate: "2026-08-05", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 25000 },
  });
  const rows = r.data.rows || [];
  let c = 0, i = 0, n = 0;
  for (const row of rows) {
    const u = (row.keys![0] || "").replace("https://workwave.fr", "");
    if (/^\/[a-z0-9-]+$/.test(u)) { c += row.clicks || 0; i += row.impressions || 0; n++; }
  }
  console.log(`  racine 1 segment           : ${n} URL, ${c} clics (${(c/30).toFixed(2)}/j), ${i} imp`);
})();
