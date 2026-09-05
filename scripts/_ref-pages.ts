import { google } from "googleapis";
import fs from "fs";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const pull = async (startDate: string, endDate: string, name: string) => {
    const all: any[] = []; let startRow = 0;
    while (true) {
      const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
        startDate, endDate, dimensions: ["page"], rowLimit: 25000, startRow } });
      const rows = r.data.rows || [];
      if (rows.length === 0) break;
      all.push(...rows); startRow += rows.length;
      if (rows.length < 25000) break;
    }
    fs.writeFileSync(`/private/tmp/refut/${name}.json`, JSON.stringify(all));
    console.log(`${name} (${startDate}->${endDate}) : ${all.length} pages`);
  };
  await pull("2026-08-06", "2026-09-02", "pages_r");
  await pull("2026-07-09", "2026-08-05", "pages_p");
})();
