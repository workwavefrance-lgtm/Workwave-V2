import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  const pages = [
    ["https://workwave.fr/plombier/debouchage/chauvigny", "https://workwave.fr/plombier/chauvigny"],
    ["https://workwave.fr/carreleur/terrasse/la-rochelle", "https://workwave.fr/carreleur/la-rochelle"],
    ["https://workwave.fr/paysagiste/entretien/brive-la-gaillarde", "https://workwave.fr/paysagiste/brive-la-gaillarde"],
  ];
  for (const [spec, list] of pages) {
    for (const [label, url] of [["SPECIALITE", spec], ["LISTING PARENT", list]] as const) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 8,
        dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "equals", expression: url }] }] } });
      const rows = r.data.rows || [];
      const tot = rows.reduce((s,x)=>s+(x.impressions||0),0);
      console.log(`\n${label} ${url.replace("https://workwave.fr","")}  (${rows.length ? tot : 0} imp sur top ${rows.length})`);
      for (const x of rows) console.log(`   ${String(x.impressions).padStart(4)} imp | ${x.clicks} clics | pos ${(x.position||0).toFixed(1).padStart(5)} | "${(x.keys||[])[0]}"`);
      if (!rows.length) console.log("   (aucune impression)");
    }
  }
}
main().catch(e=>console.error(e.message));
