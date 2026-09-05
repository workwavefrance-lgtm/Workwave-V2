import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-06-06", E = "2026-09-03";
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: S, endDate: E, dimensions: ["page"], rowLimit: 500,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/trouver-des-" }] }],
  }});
  const rows = r.data.rows || [];
  console.log(`=== pages /trouver-des-* avec impressions du ${S} au ${E} : ${rows.length} ===`);
  let hubs = 0, enfMetier = 0, enfDept = 0;
  for (const row of rows) {
    const u = (row.keys||[])[0] as string;
    const p = u.replace("https://workwave.fr", "");
    const est = /^\/trouver-des-(chantiers|clients)$/.test(p) ? "HUB" : (/-\d{2,3}$/.test(p) ? "ENFANT-DEPT" : "ENFANT-METIER");
    if (est === "HUB") hubs++; else if (est === "ENFANT-DEPT") enfDept++; else enfMetier++;
    console.log(`  ${est.padEnd(12)} | ${String(row.impressions).padStart(5)} imp | ${String(row.clicks).padStart(3)} clics | pos ${Math.round(row.position||0)} | ${p}`);
  }
  console.log(`\nRESUME : hubs=${hubs} enfants-metier=${enfMetier} enfants-dept=${enfDept}`);
}
main().catch(e => console.error(e.message));
