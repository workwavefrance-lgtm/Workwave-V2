import { google } from "googleapis";
import fs from "fs";
const OUT = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/ctr";

async function dump(sc: any, start: string, end: string, name: string) {
  const rows: any[] = [];
  let startRow = 0;
  while (true) {
    const r = await sc.searchanalytics.query({
      siteUrl: "https://workwave.fr/",
      requestBody: { startDate: start, endDate: end, dimensions: ["page"], type: "web", rowLimit: 25000, startRow },
    });
    const got = r.data.rows || [];
    if (got.length === 0) break;
    for (const x of got) rows.push({ p: x.keys[0], c: x.clicks, i: x.impressions, pos: x.position });
    startRow += got.length;
    if (got.length < 25000) break;
  }
  fs.writeFileSync(`${OUT}/${name}.json`, JSON.stringify(rows));
  const c = rows.reduce((a, b) => a + b.c, 0), i = rows.reduce((a, b) => a + b.i, 0);
  console.log(`${name} ${start}->${end} : ${rows.length} pages, ${c} clics, ${i} impressions`);
}

(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  await dump(sc, "2026-08-05", "2026-09-01", "p28");
  await dump(sc, "2026-07-08", "2026-08-04", "p28prev");
  await dump(sc, "2026-07-20", "2026-07-26", "pic");
  await dump(sc, "2026-08-26", "2026-09-01", "s7");
})();
