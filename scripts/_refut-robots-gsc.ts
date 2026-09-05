import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: await auth.getClient() as any });
  const r = await sc.searchanalytics.query({
    siteUrl: "https://workwave.fr/",
    requestBody: { startDate: "2026-08-20", endDate: "2026-09-03", dimensions: ["date"], rowLimit: 100 },
  });
  console.log("date        clics   impressions   CTR%    position");
  for (const row of r.data.rows || []) {
    console.log(`${row.keys![0]}  ${String(row.clicks).padStart(5)}   ${String(row.impressions).padStart(9)}   ${(row.ctr!*100).toFixed(2).padStart(5)}   ${row.position!.toFixed(1)}`);
  }
  const tot = (r.data.rows||[]).reduce((a,b)=>a+(b.clicks||0),0);
  const n = (r.data.rows||[]).length;
  console.log(`\nMoyenne sur ${n} jours : ${(tot/n).toFixed(1)} clics/jour`);
})().catch(e => { console.error("ERREUR:", e.message); process.exit(1); });
