/**
 * Requetes Google qui menent A LA PAGE D'ACCUEIL, avant modification du H1.
 * Mesure GSC directe, fenetre 28 jours. C'est la reference AVANT/APRES.
 */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const fin = new Date(Date.now() - 2 * 86400e3).toISOString().slice(0, 10);
  const debut = new Date(Date.now() - 30 * 86400e3).toISOString().slice(0, 10);
  console.log(`fenetre ${debut} -> ${fin}\n`);

  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: debut, endDate: fin, dimensions: ["query"], rowLimit: 40,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "equals", expression: "https://workwave.fr/" }] }],
  }});
  console.log("=== requetes de la HOME (triees par impressions) ===");
  const rows = (r.data.rows || []).sort((a: any, b: any) => (b.impressions||0)-(a.impressions||0));
  for (const row of rows)
    console.log(`  pos ${String(Math.round(row.position||0)).padStart(3)} | ${String(row.impressions).padStart(5)} imp | ${String(row.clicks).padStart(3)} clics | ${(row.keys||[]).join("")}`);
  if (!rows.length) console.log("  (aucune ligne)");

  // les mots du H1 : lesquels rapportent, sur tout le site ?
  for (const mot of ["artisan gratuit", "trouver un artisan", "artisan pres de chez"]) {
    const r2 = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: debut, endDate: fin, dimensions: ["query"], rowLimit: 8,
      dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "contains", expression: mot }] }],
    }});
    console.log(`\n=== requetes contenant "${mot}" (tout le site) ===`);
    const rw = r2.data.rows || [];
    for (const row of rw)
      console.log(`  pos ${String(Math.round(row.position||0)).padStart(3)} | ${String(row.impressions).padStart(5)} imp | ${String(row.clicks).padStart(3)} clics | ${(row.keys||[]).join("")}`);
    if (!rw.length) console.log("  (aucune)");
  }
}
main();
