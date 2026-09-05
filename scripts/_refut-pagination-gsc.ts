import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const q = async (label: string, body: any) => {
    try {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: body });
      console.log(`\n=== ${label} ===`);
      const rows = r.data.rows || [];
      let ci=0, ii=0;
      for (const row of rows) { ci += row.clicks||0; ii += row.impressions||0; }
      console.log(`  TOTAL: ${ci} clics, ${ii} impressions, ${rows.length} lignes`);
      for (const row of rows.slice(0, 15))
        console.log(`   pos ${String(Math.round(row.position||0)).padStart(3)} | ${String(row.impressions).padStart(6)} imp | ${String(row.clicks).padStart(4)} clics | ${(row.keys||[]).join(" | ")}`);
    } catch (e: any) { console.log(`\n=== ${label} ===\n  ERREUR: ${(e.response?.data?.error?.message ?? e.message).slice(0,200)}`); }
  };
  const S = "2026-08-05", E = "2026-09-01";
  await q("Pages contenant /page/ (28j)", { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 100,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/page/" }] }] });
  await q("TOTAL site (28j)", { startDate: S, endDate: E, rowLimit: 1 });
  await q("Top 20 pages du site (28j)", { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 20 });
}
main();
