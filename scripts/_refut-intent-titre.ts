import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const P = { startDate: "2026-06-04", endDate: "2026-09-02" };
  const agg = async (label: string, regex: string) => {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { ...P,
      dimensions:["page"], rowLimit: 500,
      dimensionFilterGroups:[{filters:[{dimension:"page",operator:"includingRegex",expression:regex}]}] }});
    const rows = r.data.rows||[];
    const imp = rows.reduce((a,x)=>a+(x.impressions||0),0);
    const cl  = rows.reduce((a,x)=>a+(x.clicks||0),0);
    console.log(`${label.padEnd(52)} ${String(rows.length).padStart(3)} pages vues | ${String(imp).padStart(5)} imp | ${String(cl).padStart(3)} clics`);
  };
  console.log("=== Pages qui portent DEJA le titre a intention, 04/06 -> 02/09 ===");
  await agg("/trouver-des-chantiers (hub + 132 sous-pages)", "workwave\\.fr/trouver-des-chantiers");
  await agg("/trouver-des-clients (hub + sous-pages)",       "workwave\\.fr/trouver-des-clients");
  await agg("/pro (titre prix, aucun mot d'intention)",      "workwave\\.fr/pro$");

  // Qui ranke sur les requetes d'intention "trouver des chantiers" ?
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { ...P,
    dimensions:["query","page"], rowLimit: 200,
    dimensionFilterGroups:[{filters:[{dimension:"query",operator:"contains",expression:"chantier"}]}] }});
  console.log("\n=== Toutes les requetes du site contenant 'chantier' ===");
  for (const row of (r.data.rows||[]))
    console.log(`   pos ${(row.position||0).toFixed(1).padStart(5)} | ${String(row.impressions).padStart(3)} imp | ${String(row.clicks).padStart(2)} clics | ${(row.keys||[]).join("  ->  ")}`);
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
