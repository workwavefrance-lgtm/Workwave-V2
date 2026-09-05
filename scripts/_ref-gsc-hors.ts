import { google } from "googleapis"; import fs from "fs";
const SITE = "https://workwave.fr/";
const S = "2026-08-01", E = "2026-08-28";
async function main() {
  const sm2 = new Set(fs.readFileSync("/tmp/sm2.txt", "utf8").trim().split("\n"));
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const rows: any[] = [];
  for (let start = 0; start < 100000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rs = r.data.rows || []; rows.push(...rs); if (rs.length < 25000) break;
  }
  let dansP = 0, dansC = 0, dansI = 0, horsP = 0, horsC = 0, horsI = 0;
  for (const r of rows) {
    const u = r.keys[0].split("?")[0];
    const seg = u.replace("https://workwave.fr", "").split("/").filter(Boolean);
    if (seg.length !== 2) continue;
    if (["ai","en","blog","guide-des-prix","trouver-des-chantiers","trouver-des-clients","pro","artisan"].includes(seg[0])) continue;
    if (/-\d{1,3}$/.test(seg[1])) continue; // dept
    if (sm2.has(u)) { dansP++; dansC += r.clicks; dansI += r.impressions; }
    else { horsP++; horsC += r.clicks; horsI += r.impressions; }
  }
  console.log(`Pages metier x ville avec >=1 impression (01-28/08) :`);
  console.log(`  DANS /sitemap/2.xml : ${dansP} pages, ${dansC} clics, ${dansI} impressions -> ${(dansC/dansP/28).toFixed(4)} clic/page/jour`);
  console.log(`  HORS sitemap        : ${horsP} pages, ${horsC} clics, ${horsI} impressions -> ${(horsC/horsP/28).toFixed(4)} clic/page/jour`);
  console.log(`  part des clics venant de pages HORS sitemap : ${(100*horsC/(horsC+dansC)).toFixed(1)} %`);
  console.log(`  couverture : ${dansP} des 8 235 URLs du sitemap ont eu une impression (${(100*dansP/8235).toFixed(1)} %)`);
}
main();
