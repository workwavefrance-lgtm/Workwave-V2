/** Les requetes qui amenent des impressions sur une page donnee. */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const PAGE = process.argv[2];
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({
    siteUrl: SITE,
    requestBody: {
      startDate: "2026-08-05", endDate: "2026-09-01",
      dimensions: ["query"], rowLimit: 25,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "equals", expression: PAGE }] }],
    },
  });
  const rows = r.data.rows || [];
  console.log(`${PAGE}\n${rows.length} requetes\n`);
  for (const x of rows) console.log(`  ${String(x.impressions).padStart(4)} imp · ${x.clicks} clic · pos ${Math.round((x.position||0)*10)/10} · "${x.keys?.[0]}"`);
})();
