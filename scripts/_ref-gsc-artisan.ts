import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const site = "https://workwave.fr/";
  let start = 0; const rows: any[] = [];
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl: site, requestBody: {
      startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const r = data.rows || [];
    rows.push(...r);
    console.log(`  page ${start} -> +${r.length} (cumul ${rows.length})`);
    if (r.length === 0) break;
    start += r.length;
    if (start > 400000) break;
  }
  let artN = 0, artC = 0, artI = 0;
  let art0clic = 0;
  const imps: number[] = [];
  for (const r of rows) {
    const p = String(r.keys![0]).replace("https://workwave.fr", "");
    if (!p.startsWith("/artisan/")) continue;
    artN++; artC += r.clicks || 0; artI += r.impressions || 0;
    imps.push(r.impressions || 0);
    if ((r.clicks || 0) === 0) art0clic++;
  }
  console.log(`\nTOTAL pages GSC avec >=1 impression (28 j 05/08->01/09) : ${rows.length}`);
  console.log(`dont /artisan/ : ${artN} pages, ${artC} clics, ${artI} impressions`);
  console.log(`/artisan/ a 0 clic : ${art0clic} (${(100*art0clic/artN).toFixed(1)} %)`);
  console.log(`clics par fiche par jour (moyenne sur les fiches AVEC impressions) : ${(artC/artN/28).toFixed(5)}`);
  imps.sort((a,b)=>b-a);
  console.log(`impressions : mediane ${imps[Math.floor(imps.length/2)]}, p90 ${imps[Math.floor(imps.length*0.1)]}, max ${imps[0]}`);
})();
