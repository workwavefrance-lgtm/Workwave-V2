import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  for (const type of ["web", "image", "video", "news"]) {
    try {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, type, rowLimit: 1 } as any });
      const row = (r.data.rows || [])[0];
      console.log(`type=${type.padEnd(6)} clics=${row?.clicks ?? 0}  impressions=${row?.impressions ?? 0}  pos=${row?.position ? row.position.toFixed(1) : "-"}`);
    } catch (e: any) { console.log(`type=${type} ERREUR ${(e.response?.data?.error?.message ?? e.message).slice(0,120)}`); }
  }
  // Part des pages /artisan/ dans le trafic web
  const r2 = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000 } });
  const rows = r2.data.rows || [];
  let artisan = { c: 0, i: 0, n: 0 }, listing = { c: 0, i: 0, n: 0 }, autre = { c: 0, i: 0, n: 0 };
  for (const row of rows) {
    const u = (row.keys || [])[0] || "";
    const b = u.includes("/artisan/") ? artisan : (u.split("/").filter(Boolean).length === 4 ? listing : autre);
    b.c += row.clicks || 0; b.i += row.impressions || 0; b.n++;
  }
  console.log(`\npages remontees par GSC (28j) : ${rows.length}`);
  console.log(`  /artisan/*  : ${artisan.n} pages, ${artisan.c} clics, ${artisan.i} impressions`);
  console.log(`  listings    : ${listing.n} pages, ${listing.c} clics, ${listing.i} impressions`);
  console.log(`  autres      : ${autre.n} pages, ${autre.c} clics, ${autre.i} impressions`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
