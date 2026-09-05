import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-05", E = "2026-09-01";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const m = async (label: string, filters: any[]) => {
    let pages = 0, clics = 0, imps = 0;
    for (let start = 0; start < 30000; start += 5000) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
        startDate: S, endDate: E, dimensions: ["page"], rowLimit: 5000, startRow: start,
        dimensionFilterGroups: [{ filters }] } });
      const rows = r.data.rows || [];
      for (const x of rows) { pages++; clics += x.clicks || 0; imps += x.impressions || 0; }
      if (rows.length < 5000) break;
    }
    console.log(`${label} | pages=${pages} clics=${clics} imp=${imps}`);
  };
  // controle : doit renvoyer beaucoup
  await m("CONTROLE contains /artisan/", [{ dimension: "page", operator: "contains", expression: "/artisan/" }]);
  await m("CONTROLE regex ^.*artisan.*$", [{ dimension: "page", operator: "includingRegex", expression: ".*/artisan/.*" }]);
  await m("blog contains", [{ dimension: "page", operator: "contains", expression: "/blog/" }]);
  await m("chantiers contains", [{ dimension: "page", operator: "contains", expression: "/trouver-des-chantiers/" }]);
  await m("urgence contains", [{ dimension: "page", operator: "contains", expression: "/urgence/" }]);
  await m("installation contains", [{ dimension: "page", operator: "contains", expression: "/installation/" }]);
  await m("obligation contains", [{ dimension: "page", operator: "contains", expression: "/obligation/" }]);
  await m("location-saisonniere contains", [{ dimension: "page", operator: "contains", expression: "/location-saisonniere/" }]);
  await m("guide-des-prix contains", [{ dimension: "page", operator: "contains", expression: "/guide-des-prix/" }]);
}
main().catch(e => { console.error(e.message); process.exit(1); });
