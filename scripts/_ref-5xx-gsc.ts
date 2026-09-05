import { google } from "googleapis";
import * as fs from "fs";

const URLS = fs.readFileSync("/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/urls.txt", "utf8").trim().split("\n");

(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });

  // 1) Poids total des fiches /artisan/ dans le trafic, 28 jours
  const tot = await sc.searchanalytics.query({
    siteUrl: "https://workwave.fr/",
    requestBody: { startDate: "2026-08-08", endDate: "2026-09-04", dimensions: ["page"], rowLimit: 25000 },
  });
  const rows = tot.data.rows || [];
  let cA = 0, iA = 0, cT = 0, iT = 0, nA = 0;
  for (const r of rows) {
    const p = r.keys![0];
    cT += r.clicks || 0; iT += r.impressions || 0;
    if (p.includes("/artisan/")) { cA += r.clicks || 0; iA += r.impressions || 0; nA++; }
  }
  console.log(`GSC 08/08 au 04/09, pages remontees : ${rows.length}`);
  console.log(`  TOTAL site        : ${cT} clics, ${iT} impressions`);
  console.log(`  dont /artisan/    : ${cA} clics, ${iA} impressions, sur ${nA} pages distinctes`);
  console.log(`  part /artisan/    : ${(100 * cA / Math.max(1, cT)).toFixed(2)} % des clics, ${(100 * iA / Math.max(1, iT)).toFixed(2)} % des impressions`);

  // 2) Les 54 URLs precises
  const set = new Set(URLS.map((u) => "https://workwave.fr" + u));
  let c54 = 0, i54 = 0, n54 = 0;
  for (const r of rows) {
    if (set.has(r.keys![0])) { c54 += r.clicks || 0; i54 += r.impressions || 0; n54++; }
  }
  console.log(`\nLes 54 fiches passees en 500 : ${n54} apparaissent dans GSC sur 28 jours`);
  console.log(`  ${c54} clics, ${i54} impressions au total (soit ${(i54 / 28).toFixed(2)} impressions/jour pour les 54 reunies)`);
})();
