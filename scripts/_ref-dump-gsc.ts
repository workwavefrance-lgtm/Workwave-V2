import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  let start = 0; const out: Record<string, [number, number]> = {};
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const r = data.rows || []; if (!r.length) break;
    for (const row of r) {
      const p = String(row.keys![0]).replace("https://workwave.fr", "");
      if (p.startsWith("/artisan/")) out[p.slice(9)] = [row.clicks || 0, row.impressions || 0];
    }
    start += r.length;
  }
  fs.writeFileSync("/tmp/gsc-artisan.json", JSON.stringify(out));
  console.log("slugs artisan avec impressions ecrits :", Object.keys(out).length);
})();
