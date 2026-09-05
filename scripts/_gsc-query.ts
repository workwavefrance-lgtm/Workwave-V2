import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const q = async (label: string, body: any) => {
    try {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: body });
      console.log(`\n=== ${label} ===`);
      for (const row of (r.data.rows || []))
        console.log(`  pos ${String(Math.round((row.position||0))).padStart(3)} | ${String(row.impressions).padStart(5)} imp | ${String(row.clicks).padStart(3)} clics | ${(row.keys||[]).join(" · ")}`);
      if (!(r.data.rows||[]).length) console.log("  (aucune ligne)");
    } catch (e: any) { console.log(`\n=== ${label} ===\n  ERREUR: ${(e.response?.data?.error?.message ?? e.message).slice(0,180)}`); }
  };
  const S = "2026-06-26", E = "2026-07-24";
  await q("'autour de moi' (28j, par requete)", { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 20,
    dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "contains", expression: "autour de moi" }] }] });
  await q("Top 15 requetes en POSITION 8-20 (page 2 = a pousser)", { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 200 });
}
main();
