import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const SITE = "https://workwave.fr/";
  const S = "2026-08-05", E = "2026-09-01"; // 28 jours
  const agg = async (label: string, filters: any[]) => {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["date"], rowLimit: 500,
      dimensionFilterGroups: filters.length ? [{ filters }] : [],
    }});
    const rows = r.data.rows || [];
    const c = rows.reduce((a, x) => a + (x.clicks || 0), 0);
    const i = rows.reduce((a, x) => a + (x.impressions || 0), 0);
    console.log(`${label.padEnd(34)} clics=${String(c).padStart(6)}  imp=${String(i).padStart(8)}  clics/j=${(c/28).toFixed(1)}`);
    return { c, i };
  };
  console.log(`Fenetre ${S} -> ${E} (28 jours)`);
  const tot = await agg("TOTAL site", []);
  const art = await agg("pages /artisan/", [{ dimension: "page", operator: "contains", expression: "/artisan/" }]);
  console.log(`\npart des fiches dans les clics : ${(100*art.c/tot.c).toFixed(1)} %`);
  // combien de fiches DISTINCTES rapportent au moins 1 clic / 1 impression
  const pages = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }],
  }});
  const pr = pages.data.rows || [];
  const avecClic = pr.filter(r => (r.clicks || 0) > 0).length;
  console.log(`fiches avec >=1 impression (28j) : ${pr.length}`);
  console.log(`fiches avec >=1 clic (28j)       : ${avecClic}`);
  console.log(`clic/fiche-impressionnee/jour    : ${(art.c/28/Math.max(1,pr.length)).toFixed(5)}`);
  console.log(`\nrendement si on rapporte aux 186 000 pages indexees du site : ${(art.c/28/186000).toFixed(6)} clic/page/jour`);
})();
