import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const siteUrl = "https://workwave.fr/";
  const startDate = "2026-08-05", endDate = "2026-09-02";

  // 1) Y a-t-il la moindre impression sur une URL de pagination ?
  const pag = await sc.searchanalytics.query({ siteUrl, requestBody: {
    startDate, endDate, dimensions: ["page"], rowLimit: 100,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/page/" }] }],
  }});
  const rp = pag.data.rows || [];
  console.log(`\n[1] URLs contenant "/page/" avec impressions (28 j, ${startDate} -> ${endDate}) : ${rp.length}`);
  rp.slice(0, 10).forEach((r: any) => console.log(`    ${r.keys[0]} | clics ${r.clicks} | impr ${r.impressions}`));

  // 2) Total site sur la meme fenetre
  const tot = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate, dimensions: [], rowLimit: 1 }});
  const t: any = (tot.data.rows || [])[0] || {};
  console.log(`\n[2] Total site 28 j : ${t.clicks} clics, ${t.impressions} impressions`);

  // 3) Combien de pages DISTINCTES recoivent au moins 1 impression ? (proxy du parc reellement actif)
  const pages = await sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate, dimensions: ["page"], rowLimit: 25000 }});
  const rows: any[] = pages.data.rows || [];
  console.log(`[3] pages distinctes avec >=1 impression : ${rows.length}`);
  const clicsTot = rows.reduce((a, r) => a + r.clicks, 0);
  console.log(`    clics cumules sur ces pages : ${clicsTot}`);
  const avecClic = rows.filter((r) => r.clicks > 0).length;
  console.log(`    pages ayant >=1 clic sur 28 j : ${avecClic}`);
  console.log(`    clic/page/jour moyen (sur pages actives) : ${(clicsTot / rows.length / 28).toFixed(4)}`);

  // 4) Repartition par type de page
  const type = (u: string) => {
    if (/\/artisan\//.test(u)) return "artisan";
    if (/\/page\/\d+/.test(u)) return "pagination";
    if (/\/guide-des-prix\//.test(u)) return "guide-prix";
    if (/\/trouver-des-/.test(u)) return "acquisition-pro";
    if (/\/blog\//.test(u)) return "blog";
    if (/workwave\.fr\/[^\/]+\/[^\/]+$/.test(u)) return "listing metier x lieu";
    return "autre";
  };
  const agg: Record<string, {n: number; c: number; i: number}> = {};
  rows.forEach((r) => { const k = type(r.keys[0]); agg[k] = agg[k] || {n:0,c:0,i:0}; agg[k].n++; agg[k].c += r.clicks; agg[k].i += r.impressions; });
  console.log(`\n[4] par type (pages avec impressions / clics / impressions) :`);
  Object.entries(agg).sort((a,b) => b[1].c - a[1].c).forEach(([k,v]) => console.log(`    ${k.padEnd(22)} ${String(v.n).padStart(6)} pages | ${String(v.c).padStart(5)} clics | ${String(v.i).padStart(7)} impr | ${(v.c/v.n/28).toFixed(4)} clic/page/j`));
})();
