import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const URL = "https://workwave.fr/trouver-des-chantiers";

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });

  const q = async (body: any) => {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: body });
    return r.data.rows || [];
  };
  const pageFilter = { filters: [{ dimension: "page", operator: "equals", expression: URL }] };

  console.log("=== A. Fenetres 30j, URL EXACTE (operator equals) ===");
  for (const [s, e] of [["2026-06-04","2026-07-03"],["2026-07-04","2026-08-02"],["2026-08-03","2026-09-02"]] as const) {
    const rows = await q({ startDate: s, endDate: e, dimensions: ["page"], rowLimit: 10, dimensionFilterGroups: [pageFilter] });
    for (const r of rows) console.log(`  ${s}->${e} : ${r.impressions} imp, ${r.clicks} clics, pos ${(r.position||0).toFixed(1)}`);
    if (!rows.length) console.log(`  ${s}->${e} : AUCUNE ligne`);
  }

  console.log("\n=== B. Requetes par fenetre (URL exacte) ===");
  for (const [s, e] of [["2026-06-04","2026-07-03"],["2026-07-04","2026-08-02"],["2026-08-03","2026-09-02"]] as const) {
    const rows = await q({ startDate: s, endDate: e, dimensions: ["query"], rowLimit: 100, dimensionFilterGroups: [pageFilter] });
    console.log(`\n  --- ${s} -> ${e} : ${rows.length} requetes distinctes`);
    for (const r of rows) console.log(`     pos ${(r.position||0).toFixed(1).padStart(6)} | ${String(r.impressions).padStart(4)} imp | ${r.clicks} clics | ${(r.keys||[])[0]}`);
  }

  console.log("\n=== C. Jour par jour, 90 jours (URL exacte) ===");
  const jours = await q({ startDate: "2026-06-04", endDate: "2026-09-02", dimensions: ["date"], rowLimit: 200, dimensionFilterGroups: [pageFilter] });
  for (const r of jours) console.log(`  ${(r.keys||[])[0]} : ${String(r.impressions).padStart(4)} imp, ${r.clicks} clics, pos ${(r.position||0).toFixed(1)}`);
  console.log(`  -> ${jours.length} jours avec au moins 1 impression sur 91`);
}
main().catch(e => { console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
