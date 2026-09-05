import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const R = { s: "2026-08-05", e: "2026-09-01" };
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const all = async (body: any) => { const rows: any[] = []; let start = 0;
    while (true) { const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { ...body, rowLimit: 25000, startRow: start } });
      const got = r.data.rows || []; rows.push(...got); if (!got.length) break; start += got.length; if (start >= 200000) break; } return rows; };
  const RX = /\bprix\b|\btarif|combien (ca|ça) co|coût|au m2|au m²/i;

  // A. CTR REEL par tranche de position, sur TOUTES les requetes nommees du site
  const q = await all({ startDate: R.s, endDate: R.e, dimensions: ["query"] });
  console.log("A. CTR REEL DU SITE par tranche de position (requetes nommees, 28j) :");
  console.log("   tranche |   req |    imp | clics |  CTR reel");
  for (const [a, b] of [[1,2],[2,3],[3,4],[4,5],[5,11],[11,21],[21,31],[31,999]]) {
    const s = q.filter(r => r.position >= a && r.position < b);
    const imp = s.reduce((x,r)=>x+r.impressions,0), cl = s.reduce((x,r)=>x+r.clicks,0);
    console.log(`   ${String(a).padStart(3)}-${String(b-1).padStart(3)} | ${String(s.length).padStart(5)} | ${String(imp).padStart(6)} | ${String(cl).padStart(5)} | ${(100*cl/Math.max(1,imp)).toFixed(2)}%`);
  }
  // meme decoupe, requetes PRIX seules
  const px = q.filter(r=>RX.test(r.keys[0]));
  console.log("\n   idem, requetes PRIX seules :");
  for (const [a, b] of [[1,5],[5,11],[11,21],[21,31],[31,999]]) {
    const s = px.filter(r => r.position >= a && r.position < b);
    const imp = s.reduce((x,r)=>x+r.impressions,0), cl = s.reduce((x,r)=>x+r.clicks,0);
    console.log(`   ${String(a).padStart(3)}-${String(b-1).padStart(3)} | ${String(s.length).padStart(5)} | ${String(imp).padStart(6)} | ${String(cl).padStart(5)} | ${(100*cl/Math.max(1,imp)).toFixed(2)}%`);
  }

  // B. Anonymisation SOUS les pages /guide-des-prix/ : impressions nommees vs impressions page
  const qGuide = await all({ startDate: R.s, endDate: R.e, dimensions: ["query"],
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/guide-des-prix/" }] }] });
  const pGuide = await all({ startDate: R.s, endDate: R.e, dimensions: ["page"],
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/guide-des-prix/" }] }] });
  const si = (rs:any[]) => rs.reduce((a,r)=>a+r.impressions,0), sc2 = (rs:any[]) => rs.reduce((a,r)=>a+r.clicks,0);
  console.log(`\nB. Sous /guide-des-prix/ : ${qGuide.length} requetes nommees = ${si(qGuide)} imp / ${sc2(qGuide)} clics`);
  console.log(`   vs pages /guide-des-prix/ = ${si(pGuide)} imp / ${sc2(pGuide)} clics`);
  console.log(`   -> couverture des requetes nommees : ${(100*si(qGuide)/Math.max(1,si(pGuide))).toFixed(1)}% des impressions`);

  // C. Ou atterrissent les requetes PRIX ? (dimension page, filtrees sur requetes contenant prix)
  const pPrix = await all({ startDate: R.s, endDate: R.e, dimensions: ["page"],
    dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "contains", expression: "prix" }] }] });
  const typ = (u:string) => { const p = u.replace("https://workwave.fr","").split("?")[0];
    if (p.startsWith("/guide-des-prix/")) return "/guide-des-prix/";
    if (p.startsWith("/artisan/")) return "/artisan/";
    if (p.startsWith("/blog/")) return "/blog/";
    if (p.startsWith("/trouver-des-")) return "/trouver-des-*";
    if (p.startsWith("/barometre")) return "/barometre-*";
    if (p.startsWith("/ai/")||p.startsWith("/en/")) return "/ai/*";
    const seg = p.split("/").filter(Boolean);
    if (seg.length===1) return "/[metier]";
    if (seg.length===2) return /-\d{2,3}$/.test(seg[1]) ? "/[metier]/[dept]" : "/[metier]/[ville]";
    if (seg.length===3) return "/[metier]/[spe]/[ville]"; return p; };
  const m: any = {};
  for (const r of pPrix) { const t = typ(r.keys[0]); m[t] ??= {n:0,imp:0,cl:0}; m[t].n++; m[t].imp+=r.impressions; m[t].cl+=r.clicks; }
  console.log(`\nC. Pages qui recoivent les requetes contenant "prix" (${si(pPrix)} imp / ${sc2(pPrix)} clics au total) :`);
  for (const [k,v] of Object.entries(m).sort((a:any,b:any)=>b[1].imp-a[1].imp) as any)
    console.log(`   ${k.padEnd(24)} ${String(v.n).padStart(5)} pages | ${String(v.imp).padStart(6)} imp | ${String(v.cl).padStart(4)} clics`);
}
main().catch((e) => { console.error("ERREUR", e?.response?.data?.error?.message || e.message); process.exit(1); });
