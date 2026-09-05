import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  for (const [S,E,lab] of [["2026-06-04","2026-08-31","avant le correctif maillage (01/09)"],["2026-09-01","2026-09-04","depuis le correctif maillage"]] as const) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 500,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/trouver-des-" }] }] }});
    const rows = (r.data.rows||[]);
    const enfants = rows.filter(x => (x.keys[0].match(/\/trouver-des-[a-z]+\/./)));
    const i = rows.reduce((a,x)=>a+(x.impressions||0),0);
    console.log(`${lab} [${S}->${E}] : ${rows.length} pages avec impression (dont ${enfants.length} enfants) | ${i} imp`);
    for (const x of enfants) console.log(`      pos ${(x.position||0).toFixed(1).padStart(5)} | ${String(x.impressions).padStart(4)} imp | ${x.keys[0].replace("https://workwave.fr","")}`);
  }
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
