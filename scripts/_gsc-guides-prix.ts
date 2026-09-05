import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";

(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: await auth.getClient() as any });
  const site = "https://workwave.fr/";
  const end = "2026-09-03", start = "2026-08-05";

  for (const [label, expr] of [["/guide-des-prix/", "https://workwave.fr/guide-des-prix/"], ["/prix (metier)", "/prix"]] as const) {
    const r = await sc.searchanalytics.query({ siteUrl: site, requestBody: {
      startDate: start, endDate: end, dimensions: ["page"], rowLimit: 25000,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: expr }] }],
    }});
    const rows = r.data.rows || [];
    const clicks = rows.reduce((s, x) => s + (x.clicks || 0), 0);
    const imps = rows.reduce((s, x) => s + (x.impressions || 0), 0);
    console.log(`${label} : ${rows.length} pages, ${clicks} clics, ${imps} impressions sur 30j (${start} -> ${end})`);
    for (const x of rows.slice(0, 5)) console.log(`   ${x.clicks} clics / ${x.impressions} imp / pos ${(x.position||0).toFixed(1)}  ${x.keys?.[0]}`);
  }
  // total site pour comparaison
  const t = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: start, endDate: end, dimensions: [] }});
  console.log("TOTAL SITE 30j :", t.data.rows?.[0]?.clicks, "clics /", t.data.rows?.[0]?.impressions, "impressions");
})();
