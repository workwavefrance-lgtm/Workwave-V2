import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const run = async (label: string, body: any) => {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: body });
    const rows = r.data.rows || [];
    console.log(`\n### ${label} (${rows.length} lignes)`);
    let ti=0, tc=0;
    for (const row of rows) {
      ti += row.impressions||0; tc += row.clicks||0;
      console.log(`   pos ${(row.position||0).toFixed(1).padStart(5)} | ${String(row.impressions).padStart(6)} imp | ${String(row.clicks).padStart(4)} clics | ${(row.keys||[]).join(" || ")}`);
    }
    console.log(`   TOTAL: ${ti} imp, ${tc} clics`);
  };
  const P = { startDate: "2026-06-04", endDate: "2026-09-02" };
  // 1. Total exact de /pro (dimension page uniquement)
  await run("/pro exact - total page", { ...P, dimensions:["page"], rowLimit: 5,
    dimensionFilterGroups:[{filters:[{dimension:"page",operator:"equals",expression:"https://workwave.fr/pro"}]}] });
  // 2. Toutes les pages "pro" (acquisition pro) du trimestre
  await run("pages acquisition pro (contains /pro OU /trouver-des-)", { ...P, dimensions:["page"], rowLimit: 100,
    dimensionFilterGroups:[{filters:[{dimension:"page",operator:"includingRegex",expression:"workwave\\.fr/(pro($|/)|trouver-des-)"}]}] });
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
