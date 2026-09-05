import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-05", E = "2026-09-01"; // 28 jours pleins

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });

  const total = async (label: string, filters: any[] | null) => {
    const body: any = { startDate: S, endDate: E, dimensions: ["date"], rowLimit: 1000 };
    if (filters) body.dimensionFilterGroups = [{ filters }];
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: body });
    const rows = r.data.rows || [];
    const c = rows.reduce((a, x) => a + (x.clicks || 0), 0);
    const i = rows.reduce((a, x) => a + (x.impressions || 0), 0);
    console.log(`${label.padEnd(42)} clics=${String(c).padStart(6)}  imp=${String(i).padStart(8)}  clics/j=${(c/28).toFixed(1)}`);
    return { c, i };
  };

  console.log(`Fenetre ${S} -> ${E} (28 jours)`);
  await total("TOTAL SITE", null);
  await total("/guide-des-prix/", [{ dimension: "page", operator: "contains", expression: "/guide-des-prix/" }]);
  await total("/blog/", [{ dimension: "page", operator: "contains", expression: "/blog/" }]);
  await total("/trouver-des-chantiers/", [{ dimension: "page", operator: "contains", expression: "/trouver-des-chantiers" }]);
  await total("/trouver-des-clients/", [{ dimension: "page", operator: "contains", expression: "/trouver-des-clients" }]);
  await total("/barometre", [{ dimension: "page", operator: "contains", expression: "/barometre" }]);
  await total("intention /urgence", [{ dimension: "page", operator: "contains", expression: "/urgence" }]);
  await total("intention /installation", [{ dimension: "page", operator: "contains", expression: "/installation" }]);
  await total("intention /obligation", [{ dimension: "page", operator: "contains", expression: "/obligation" }]);
  await total("intention /location-saisonniere", [{ dimension: "page", operator: "contains", expression: "/location-saisonniere" }]);
  await total("/artisan/ (fiches)", [{ dimension: "page", operator: "contains", expression: "/artisan/" }]);
  await total("/verifier-artisan", [{ dimension: "page", operator: "contains", expression: "/verifier-artisan" }]);
}
main().catch(e => { console.error("ERR", e.message); process.exit(1); });
