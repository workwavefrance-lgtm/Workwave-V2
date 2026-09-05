import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";

const SITE = "https://workwave.fr/";

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: await auth.getClient() as any });

  const end = "2026-09-02";
  const start = "2026-08-04"; // 30 jours
  let rows: any[] = [];
  for (let s = 0; s < 25000; s += 5000) {
    const r = await sc.searchanalytics.query({
      siteUrl: SITE,
      requestBody: { startDate: start, endDate: end, dimensions: ["query"], rowLimit: 5000, startRow: s },
    });
    const d = r.data.rows || [];
    rows = rows.concat(d);
    if (d.length < 5000) break;
  }
  console.log(`fenetre ${start} -> ${end} : ${rows.length} requetes remontees`);
  const totalImp = rows.reduce((n, r) => n + (r.impressions || 0), 0);
  const totalClics = rows.reduce((n, r) => n + (r.clicks || 0), 0);
  console.log(`TOTAL toutes requetes : ${totalImp} impressions, ${totalClics} clics`);

  const re = /avis|note|notation|meilleur|etoile|étoile|classement|top /i;
  const m = rows.filter((r) => re.test(r.keys[0]));
  const imp = m.reduce((n, r) => n + (r.impressions || 0), 0);
  const clk = m.reduce((n, r) => n + (r.clicks || 0), 0);
  const posMoy = m.reduce((n, r) => n + (r.position || 0) * (r.impressions || 0), 0) / Math.max(imp, 1);
  console.log(`\nINTENTION avis/note/meilleur : ${m.length} requetes, ${imp} impressions, ${clk} clics, position ponderee ${posMoy.toFixed(1)}`);
  console.log(`part des impressions du site : ${((imp / totalImp) * 100).toFixed(2)} %`);

  console.log("\nTop 25 de cette intention :");
  m.sort((a, b) => b.impressions - a.impressions).slice(0, 25).forEach((r) => {
    console.log(`  ${String(r.impressions).padStart(5)} imp ${String(r.clicks).padStart(3)} clics pos ${(r.position||0).toFixed(1).padStart(5)}  ${r.keys[0]}`);
  });

  // Strictement "avis" uniquement
  const reA = /\bavis\b/i;
  const mA = rows.filter((r) => reA.test(r.keys[0]));
  const impA = mA.reduce((n, r) => n + (r.impressions || 0), 0);
  const clkA = mA.reduce((n, r) => n + (r.clicks || 0), 0);
  console.log(`\nSTRICT "avis" seul : ${mA.length} requetes, ${impA} impressions, ${clkA} clics`);
  mA.sort((a,b)=>b.impressions-a.impressions).slice(0,10).forEach((r)=>console.log(`  ${r.impressions} imp ${r.clicks} clics pos ${(r.position||0).toFixed(1)} ${r.keys[0]}`));
}
main().catch(e => console.error(e.message));
