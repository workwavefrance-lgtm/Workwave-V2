import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  for (const frag of ["chauvigny","la-rochelle/","brive-la-gaillarde"]) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 15,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: frag }] }] } });
    console.log(`\n=== pages contenant "${frag}" ===`);
    for (const x of (r.data.rows||[]).slice(0,12)) console.log(`  ${String(x.impressions).padStart(5)} imp | ${String(x.clicks).padStart(3)} clics | pos ${(x.position||0).toFixed(1).padStart(5)} | ${(x.keys||[])[0].replace("https://workwave.fr","")}`);
    if (!(r.data.rows||[]).length) console.log("  (aucune)");
  }
}
main().catch(e=>console.error(e.message));
