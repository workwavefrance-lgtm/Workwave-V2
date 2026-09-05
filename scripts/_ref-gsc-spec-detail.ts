import { google } from "googleapis"; import fs from "fs";
const SITE = "https://workwave.fr/";
async function main() {
  const villes = new Set(fs.readFileSync(process.argv[2],"utf8").split("\n").map(s=>s.trim()).filter(Boolean));
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  let start = 0; const rows: any[] = [];
  while (true) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const got = r.data.rows || []; rows.push(...got);
    if (got.length < 25000) break; start += got.length;
  }
  const spec = rows.filter(r => { const p = new URL(r.keys[0]).pathname.split("/").filter(Boolean); return p.length===3 && !["artisan","ai","en","blog","guide-des-prix","trouver-des-chantiers","trouver-des-clients"].includes(p[0]); });
  let dansA = {n:0,c:0,i:0}, horsA = {n:0,c:0,i:0};
  console.log("PAGES SPECIALITE AVEC CLICS :");
  for (const r of spec.sort((a,b)=>(b.clicks||0)-(a.clicks||0))) {
    const ville = new URL(r.keys[0]).pathname.split("/").filter(Boolean)[2].split("?")[0];
    const dans = villes.has(ville);
    const t = dans ? dansA : horsA; t.n++; t.c += r.clicks||0; t.i += r.impressions||0;
    if ((r.clicks||0) > 0) console.log(`  ${r.clicks} clics | ${String(r.impressions).padStart(4)} imp | pos ${(r.position||0).toFixed(1).padStart(5)} | ville dans sitemap3 = ${dans ? "OUI" : "NON"} | ${new URL(r.keys[0]).pathname}`);
  }
  console.log(`\nBILAN sur ${spec.length} pages specialite ayant au moins 1 impression :`);
  console.log(`  ville PRESENTE dans sitemap/3 (95 grandes villes) : ${dansA.n} pages | ${dansA.i} imp | ${dansA.c} clics`);
  console.log(`  ville ABSENTE du sitemap/3 (petites communes)     : ${horsA.n} pages | ${horsA.i} imp | ${horsA.c} clics`);
}
main().catch(e=>console.error(e.message));
