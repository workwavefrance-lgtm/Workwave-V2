import { google } from "googleapis";
const SITE = "https://workwave.fr/";
// fenetre pleine depuis publication (13/05) jusqu a hier
const S = "2026-05-13", E = "2026-09-03";
async function q(sc:any, body:any) { const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: body }); return r.data.rows || []; }
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });

  // 1. les 13 articles pro, fenetre PLEINE depuis publication
  const pro = await q(sc, { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 100,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "obtenir-leads-artisan" }] }] });
  console.log(`[1] 13 articles "obtenir-leads-artisan", ${S} -> ${E}`);
  console.log(`    pages avec >=1 impression : ${pro.length}`);
  console.log(`    total : ${pro.reduce((a,x)=>a+(x.impressions||0),0)} imp, ${pro.reduce((a,x)=>a+(x.clicks||0),0)} clics`);

  // 2. TOUT le blog, meme fenetre -> groupe de controle
  const blog = await q(sc, { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/blog/" }] }] });
  const bImp = blog.reduce((a:number,x:any)=>a+(x.impressions||0),0), bClk = blog.reduce((a:number,x:any)=>a+(x.clicks||0),0);
  console.log(`\n[2] CONTROLE - tout /blog/, meme fenetre`);
  console.log(`    pages avec >=1 impression : ${blog.length} (sur 164 publiees)`);
  console.log(`    total : ${bImp} imp, ${bClk} clics`);
  console.log(`    top 15 :`);
  for (const r of blog.sort((a:any,b:any)=>(b.impressions||0)-(a.impressions||0)).slice(0,15))
    console.log(`      pos ${(r.position||0).toFixed(1).padStart(5)} | ${String(r.impressions).padStart(5)} imp | ${String(r.clicks).padStart(3)} clics | ${r.keys[0].replace("https://workwave.fr","")}`);

  // 3. total site meme fenetre pour mise en perspective
  const tot = await q(sc, { startDate: S, endDate: E, dimensions: ["date"], rowLimit: 200 });
  const tImp = tot.reduce((a:number,x:any)=>a+(x.impressions||0),0), tClk = tot.reduce((a:number,x:any)=>a+(x.clicks||0),0);
  console.log(`\n[3] SITE ENTIER meme fenetre : ${tImp} imp, ${tClk} clics`);
  console.log(`    part du blog : ${(100*bImp/tImp).toFixed(2)}% des impressions, ${(100*bClk/tClk).toFixed(2)}% des clics`);
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
