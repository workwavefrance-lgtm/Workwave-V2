import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({
    siteUrl: "https://workwave.fr/",
    requestBody: { startDate: "2026-08-20", endDate: "2026-09-04", dimensions: ["date"], rowLimit: 100 },
  });
  let c = 0, i = 0, n = 0;
  for (const row of r.data.rows || []) {
    console.log(`  ${row.keys![0]} : ${row.clicks} clics, ${row.impressions} impressions, pos ${(row.position || 0).toFixed(1)}`);
    c += row.clicks || 0; i += row.impressions || 0; n++;
  }
  console.log(`\nmoyenne sur ${n} jours : ${(c / n).toFixed(1)} clics/jour, ${(i / n).toFixed(0)} impressions/jour`);
  console.log(`ratio clics par page indexee et par jour (186 000 indexees) : ${(c / n / 186000).toFixed(6)}`);
  console.log(`pages indexees supplementaires necessaires pour +5 clics/jour : ${Math.round(5 / (c / n / 186000))}`);
})();
