import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const q = async (label: string, filters: any[], dims: string[]) => {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: "2026-06-04", endDate: "2026-09-02", dimensions: dims, rowLimit: 60,
      dimensionFilterGroups: [{ filters }],
    }});
    const rows = r.data.rows || [];
    console.log(`\n### ${label} (${rows.length} lignes)`);
    for (const row of rows.slice(0,30))
      console.log(`   pos ${(row.position||0).toFixed(1).padStart(5)} | ${String(row.impressions).padStart(5)} imp | ${String(row.clicks).padStart(3)} clics | ${(row.keys||[]).join(" || ")}`);
  };
  await q("Requetes -> /pro", [{dimension:"page",operator:"equals",expression:"https://workwave.fr/pro"}], ["query"]);
  await q("Requetes -> /trouver-des-chantiers*", [{dimension:"page",operator:"contains",expression:"/trouver-des-chantiers"}], ["query"]);
  await q("Requetes -> /trouver-des-clients*", [{dimension:"page",operator:"contains",expression:"/trouver-des-clients"}], ["query"]);
  await q("Requetes -> /pro/* (sous-pages)", [{dimension:"page",operator:"contains",expression:"workwave.fr/pro/"}], ["query","page"]);
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
