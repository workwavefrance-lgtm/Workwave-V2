import { google } from "googleapis";
import * as fs from "fs";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const site = "https://workwave.fr/";
  const urls = fs.readFileSync(process.argv[2], "utf8").trim().split("\n");
  let totClics = 0, totImpr = 0, avecImpr = 0, avecClic = 0;
  for (const u of urls) {
    const r = await sc.searchanalytics.query({
      siteUrl: site,
      requestBody: {
        startDate: "2026-08-07", endDate: "2026-09-03", dimensions: [],
        dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "equals", expression: "https://workwave.fr" + u }] }],
      },
    });
    const row = r.data.rows?.[0];
    const c = row?.clicks || 0, i = row?.impressions || 0;
    totClics += c; totImpr += i;
    if (i > 0) avecImpr++;
    if (c > 0) avecClic++;
  }
  console.log(`Les 45 fiches qui ont recu un 500 le 03/09, performance GSC sur 28 jours :`);
  console.log(`  fiches avec au moins 1 impression : ${avecImpr} / 45`);
  console.log(`  fiches avec au moins 1 clic       : ${avecClic} / 45`);
  console.log(`  impressions cumulees              : ${totImpr}`);
  console.log(`  clics cumules                     : ${totClics}`);
  console.log(`  => clic/fiche/jour reel de ce lot : ${(totClics / 45 / 28).toFixed(5)}`);
})();
