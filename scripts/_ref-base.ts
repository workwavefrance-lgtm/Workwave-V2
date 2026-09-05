import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function fen(S: string, E: string) {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const rows: any[] = [];
  for (let start = 0; start < 100000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rs = r.data.rows || []; rows.push(...rs); if (rs.length < 25000) break;
  }
  let p = 0, c = 0, pc = 0;
  for (const r of rows) {
    const seg = r.keys[0].split("?")[0].replace("https://workwave.fr","").split("/").filter(Boolean);
    if (seg.length !== 2) continue;
    if (["ai","en","blog","guide-des-prix","trouver-des-chantiers","trouver-des-clients","pro","artisan"].includes(seg[0])) continue;
    if (/-\d{1,3}$/.test(seg[1])) continue;
    p++; c += r.clicks; if (r.clicks > 0) pc++;
  }
  console.log(`${S} -> ${E} : metier-ville, ${p} pages avec impression, ${pc} pages avec >=1 clic, ${c} clics`);
  console.log(`   clic/jour par page AVEC IMPRESSION : ${(c/p/28).toFixed(4)}   |   par page AVEC CLIC (denominateur de l audit) : ${(c/pc/28).toFixed(4)}`);
}
(async () => { await fen("2026-08-07","2026-09-03"); await fen("2026-08-01","2026-08-28"); })();
