import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const SITE = "https://workwave.fr/";
  const S = "2026-08-05", E = "2026-09-01";
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }],
  }});
  const rows = (r.data.rows || []).map(x => ({ p: x.keys![0], c: x.clicks || 0, i: x.impressions || 0 }))
    .sort((a,b) => b.c - a.c);
  const tot = rows.reduce((a,x)=>a+x.c,0);
  console.log(`fiches remontees (cap 25000) : ${rows.length}  clics total ${tot}`);
  let cum = 0;
  for (const n of [10, 50, 100, 500, 1000, 5000, 10000, 25000]) {
    cum = rows.slice(0, n).reduce((a,x)=>a+x.c,0);
    console.log(`  top ${String(n).padStart(5)} fiches : ${String(cum).padStart(5)} clics (${(100*cum/tot).toFixed(1)} %)`);
  }
  const q1 = rows.filter(x => x.c === 0).length;
  console.log(`  fiches avec impressions mais 0 clic : ${q1} (${(100*q1/rows.length).toFixed(1)} %)`);
  // mediane des clics parmi celles qui en ont
  const avec = rows.filter(x=>x.c>0).map(x=>x.c).sort((a,b)=>a-b);
  console.log(`  mediane clics parmi les fiches qui cliquent (28j) : ${avec[Math.floor(avec.length/2)]}`);
  console.log(`  clic/jour d'une fiche mediane qui clique : ${(avec[Math.floor(avec.length/2)]/28).toFixed(4)}`);
})();
