import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const QUERIES = ["climaticiens lyon","débarras gardanne","artisan plâtrier cluny","nettoyage vitres sartrouville","devis menuisier samer","maçonnerie quincey","plombier poitiers","meilleur déménageur gironde"];
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  for (const qq of QUERIES) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 5,
      dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "equals", expression: qq }] }] } });
    console.log(`\n"${qq}"`);
    for (const x of (r.data.rows||[])) console.log(`   pos ${(x.position||0).toFixed(1)} | imp ${x.impressions} | clics ${x.clicks} | ${x.keys?.[0]}`);
    if (!(r.data.rows||[]).length) console.log("   (aucune page)");
  }
  // top pages par impressions
  const rp = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 30 } });
  console.log("\n=== TOP 30 PAGES par clics ===");
  for (const x of (rp.data.rows||[])) console.log(`pos ${(x.position||0).toFixed(1).padStart(5)} | imp ${String(x.impressions).padStart(5)} | clics ${String(x.clicks).padStart(4)} | ${x.keys?.[0]}`);
}
main().catch(e=>console.error(e.message));
