/** Clics et impressions jour par jour, pour voir si ca repart. */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: "2026-08-01", endDate: "2026-09-05", dimensions: ["date"], rowLimit: 100 } });
  const rows = (r.data.rows || []).sort((a: any, b: any) => a.keys[0].localeCompare(b.keys[0]));
  console.log("  jour         clics   impressions   position");
  for (const x of rows) {
    const barre = "#".repeat(Math.round((x.clicks || 0) / 15));
    console.log(`  ${x.keys?.[0]}  ${String(x.clicks).padStart(5)} ${String(x.impressions).padStart(13)}      ${(Math.round((x.position || 0) * 10) / 10).toString().padStart(5)}  ${barre}`);
  }
  const n = rows.length;
  const moy = (a: number, b: number) => rows.slice(a, b).reduce((s: number, x: any) => s + x.clicks, 0) / (b - a);
  console.log(`\n  moyenne des 7 derniers jours disponibles : ${moy(n - 7, n).toFixed(0)} clics/jour`);
  console.log(`  moyenne des 7 jours precedents           : ${moy(n - 14, n - 7).toFixed(0)} clics/jour`);
  console.log(`  moyenne des 7 jours d'avant              : ${moy(n - 21, n - 14).toFixed(0)} clics/jour`);
})();
