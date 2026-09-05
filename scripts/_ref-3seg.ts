import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const m = async (label: string, S: string, E: string, expr: string) => {
    let pages = 0, clics = 0, imps = 0; const ex: string[] = [];
    for (let start = 0; start < 30000; start += 5000) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
        startDate: S, endDate: E, dimensions: ["page"], rowLimit: 5000, startRow: start,
        dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "includingRegex", expression: expr }] }] } });
      const rows = r.data.rows || [];
      for (const x of rows) { pages++; clics += x.clicks || 0; imps += x.impressions || 0;
        if (ex.length < 8) ex.push(`${(x.keys||[])[0]} (${x.clicks}c/${x.impressions}i)`); }
      if (rows.length < 5000) break;
    }
    console.log(`${label} [${S}->${E}] pages=${pages} clics=${clics} imp=${imps}`);
    for (const e of ex) console.log("    " + e);
  };
  const RE3 = "^https://workwave\\.fr/[a-z0-9-]+/[a-z0-9-]+/[a-z0-9-]+$";
  await m("TOUTES pages a 3 segments", "2026-08-05", "2026-09-01", RE3);
  await m("TOUTES pages a 3 segments (90j)", "2026-06-06", "2026-09-01", RE3);
  await m("blog (90j)", "2026-06-06", "2026-09-01", "^https://workwave\\.fr/blog/.*");
  await m("chantiers (90j)", "2026-06-06", "2026-09-01", "^https://workwave\\.fr/trouver-des-chantiers/.*");
}
main().catch(e => { console.error(e.message); process.exit(1); });
