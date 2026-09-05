import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const bloc = async (label: string, expr: string, S: string, E: string) => {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["page"], rowLimit: 200,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: expr }] }],
    }});
    const rows = r.data.rows || [];
    const ti = rows.reduce((a,x)=>a+(x.impressions||0),0), tc = rows.reduce((a,x)=>a+(x.clicks||0),0);
    console.log(`\n### ${label} [${S} -> ${E}] : ${rows.length} pages, ${ti} imp, ${tc} clics`);
    for (const row of rows.slice(0,15))
      console.log(`   pos ${(row.position||0).toFixed(1).padStart(5)} | ${String(row.impressions).padStart(5)} imp | ${String(row.clicks).padStart(4)} clics | ${(row.keys||[])[0]?.replace("https://workwave.fr","")}`);
  };
  // 3 mois
  await bloc("/trouver-des-chantiers/*", "/trouver-des-chantiers", "2026-06-04", "2026-09-02");
  await bloc("/trouver-des-clients/*", "/trouver-des-clients", "2026-06-04", "2026-09-02");
  await bloc("/pro (toutes)", "workwave.fr/pro", "2026-06-04", "2026-09-02");
  // evolution mensuelle
  for (const [s,e] of [["2026-06-04","2026-07-03"],["2026-07-04","2026-08-02"],["2026-08-03","2026-09-02"]] as const) {
    await bloc("EVOL /trouver-des-chantiers", "/trouver-des-chantiers", s, e);
    await bloc("EVOL /pro", "workwave.fr/pro", s, e);
  }
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
