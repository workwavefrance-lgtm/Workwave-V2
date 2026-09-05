/**
 * Les pages listing metier x ville qui recoivent deja des impressions sont-elles
 * dans le sitemap ? Si la majorite est HORS sitemap, la decouverte n est pas le
 * verrou : Google les trouve deja.
 */
import { google } from "googleapis"; import fs from "fs";
const DEBUT = "2026-08-05", FIN = "2026-09-01";
(async () => {
  const sm = new Set(fs.readFileSync("/tmp/sm2_villes_ref.txt", "utf8").trim().split("\n"));
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const rows: any[] = [];
  for (let start = 0; start < 25000; start += 5000) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: DEBUT, endDate: FIN, dimensions: ["page"], rowLimit: 5000, startRow: start } });
    const got = r.data.rows || []; rows.push(...got);
    if (got.length < 5000) break;
  }
  let dans = 0, hors = 0, clicsDans = 0, clicsHors = 0, impDans = 0, impHors = 0;
  const exHors: string[] = [];
  for (const r of rows) {
    const p = new URL(r.keys![0]).pathname;
    const seg = p.split("/").filter(Boolean);
    if (seg.length !== 2 || /-\d{2,3}$/.test(seg[1])) continue;
    if (p.startsWith("/artisan") || p.startsWith("/blog") || p.startsWith("/guide-des-prix") || p.startsWith("/ai") || p.startsWith("/en") || p.startsWith("/trouver-des")) continue;
    if (sm.has(p)) { dans++; clicsDans += r.clicks; impDans += r.impressions; }
    else { hors++; clicsHors += r.clicks; impHors += r.impressions; if (exHors.length < 6 && r.clicks > 0) exHors.push(`${p} (${r.clicks} clics)`); }
  }
  console.log(`Fenetre ${DEBUT} -> ${FIN}, pages listing metier x ville ayant au moins 1 impression :`);
  console.log(`  DANS le sitemap  : ${dans} pages, ${clicsDans} clics, ${impDans} impressions`);
  console.log(`  HORS sitemap     : ${hors} pages, ${clicsHors} clics, ${impHors} impressions`);
  console.log(`  part hors sitemap : ${(100*hors/(dans+hors)).toFixed(1)} % des pages, ${(100*clicsHors/(clicsDans+clicsHors)).toFixed(1)} % des clics`);
  console.log(`  exemples hors sitemap avec clics :`, exHors.join(" | "));
})();
