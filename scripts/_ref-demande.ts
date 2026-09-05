import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const q = async (label: string, expr: string, S: string, E: string) => {
    try {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
        startDate: S, endDate: E, dimensions: ["query"], rowLimit: 300,
        dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "contains", expression: expr }] }] } });
      const rows = r.data.rows || [];
      let ti=0, tc=0; for (const x of rows) { ti += x.impressions||0; tc += x.clicks||0; }
      console.log(`\n=== "${expr}" (${label}) : ${rows.length} requetes, ${ti} imp, ${tc} clics ===`);
      for (const x of rows.slice(0,15))
        console.log(`  pos ${String(Math.round(x.position||0)).padStart(3)} | ${String(x.impressions).padStart(5)} imp | ${String(x.clicks).padStart(3)} cl | ${(x.keys||[]).join("")}`);
    } catch (e: any) { console.log(`\n=== ${expr} ===\n  ERREUR: ${(e.response?.data?.error?.message ?? e.message).slice(0,180)}`); }
  };
  // fenetre 28j recente ET fenetre large 3 mois pour ne pas rater du signal rare
  const S28="2026-08-05", E28="2026-09-01";
  const S90="2026-06-04", E90="2026-09-01";
  await q("28j", "chantier", S28, E28);
  await q("90j", "chantier", S90, E90);
  await q("90j", "autour de moi", S90, E90);
  await q("90j", "a proximite", S90, E90);
  await q("90j", "trouver des chantiers", S90, E90);
  await q("90j", "devis a distribuer", S90, E90);
}
main();
