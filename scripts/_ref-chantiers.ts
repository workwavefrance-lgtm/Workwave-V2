import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const q = async (label: string, body: any) => {
    try {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: body });
      const rows = r.data.rows || [];
      console.log(`\n=== ${label} === (${rows.length} lignes)`);
      let ti=0, tc=0;
      for (const row of rows) { ti += row.impressions||0; tc += row.clicks||0; }
      for (const row of rows.slice(0,25))
        console.log(`  pos ${String(Math.round(row.position||0)).padStart(3)} | ${String(row.impressions).padStart(6)} imp | ${String(row.clicks).padStart(4)} clics | ${(row.keys||[]).join(" · ").slice(0,95)}`);
      console.log(`  TOTAL: ${ti} impressions, ${tc} clics`);
    } catch (e: any) { console.log(`\n=== ${label} ===\n  ERREUR: ${(e.response?.data?.error?.message ?? e.message).slice(0,200)}`); }
  };
  const S = "2026-08-05", E = "2026-09-01"; // 28 jours
  await q("Pages /trouver-des-chantiers (28j)", { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 500,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/trouver-des-chantiers" }] }] });
  await q("Requetes sur /trouver-des-chantiers (28j)", { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 100,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/trouver-des-chantiers" }] }] });
  await q("Pages /trouver-des-clients (28j)", { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 200,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/trouver-des-clients" }] }] });
}
main();
