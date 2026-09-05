import { google } from "googleapis";
import fs from "fs";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const pull = async (sd: string, ed: string, dim: string, name: string) => {
    const all: any[] = []; let startRow = 0;
    while (true) {
      const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
        startDate: sd, endDate: ed, dimensions: [dim], rowLimit: 25000, startRow } });
      const rows = r.data.rows || []; if (!rows.length) break;
      all.push(...rows); startRow += rows.length; if (rows.length < 25000) break;
    }
    fs.writeFileSync(`/private/tmp/refut/${name}.json`, JSON.stringify(all));
    console.log(`${name} : ${all.length} lignes`);
  };
  await pull("2026-07-13", "2026-07-26", "page", "pic_pages");
  await pull("2026-07-13", "2026-07-26", "query", "pic_q");
  await pull("2026-08-20", "2026-09-02", "query", "rec_q");
})();
