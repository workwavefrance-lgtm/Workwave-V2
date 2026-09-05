import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const KNOWN = new Set(["artisan","guide-des-prix","trouver-des-chantiers","trouver-des-clients","blog","ai","en","recherche","deposer-projet","pro","departements","verifier-artisan","avis","enquete-pro","feedback","cgu","cgv","mentions-legales","a-propos"]);
function typ(u: string): string {
  let p: string;
  try { p = new URL(u).pathname; } catch { return "?"; }
  const seg = p.split("/").filter(Boolean);
  if (!seg.length) return "home";
  const s0 = seg[0];
  if (s0 === "artisan") return "fiche";
  if (s0 === "guide-des-prix") return "guide-prix";
  if (s0 === "trouver-des-chantiers") return "trouver-chantiers";
  if (s0 === "trouver-des-clients") return "trouver-clients";
  if (s0 === "blog") return "blog";
  if (s0 === "ai" || s0 === "en") return "ai";
  if (s0.startsWith("barometre")) return "barometre";
  if (KNOWN.has(s0)) return "fixe";
  if (seg.length === 1) return "metier-racine";
  if (seg.length === 2) return "metier-ville-ou-dept";
  if (seg.length === 3) return "metier-specialite-ville";
  return "autre";
}
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = process.argv[2] || "2026-08-05", E = process.argv[3] || "2026-09-01";
  let start = 0; const rows: any[] = [];
  while (true) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const got = r.data.rows || [];
    rows.push(...got);
    if (got.length < 25000) break;
    start += got.length;
  }
  console.log(`Fenetre ${S} -> ${E} | ${rows.length} pages avec au moins 1 impression`);
  const agg = new Map<string, {p:number,c:number,i:number,pos:number}>();
  for (const r of rows) {
    const t = typ((r.keys||[])[0] || "");
    const a = agg.get(t) || {p:0,c:0,i:0,pos:0};
    a.p++; a.c += r.clicks||0; a.i += r.impressions||0; a.pos += (r.position||0)*(r.impressions||0);
    agg.set(t, a);
  }
  const tot = [...agg.values()].reduce((s,a)=>({p:s.p+a.p,c:s.c+a.c,i:s.i+a.i,pos:0}),{p:0,c:0,i:0,pos:0});
  console.log(`TOTAL: ${tot.p} pages | ${tot.c} clics | ${tot.i} impressions`);
  console.log("type                          pages    clics       imp   pos.moy   clics/j");
  for (const [t,a] of [...agg.entries()].sort((x,y)=>y[1].c-x[1].c)) {
    const jours = (new Date(E).getTime()-new Date(S).getTime())/86400000 + 1;
    console.log(`${t.padEnd(28)} ${String(a.p).padStart(6)} ${String(a.c).padStart(8)} ${String(a.i).padStart(9)}   ${(a.pos/(a.i||1)).toFixed(1).padStart(6)}   ${(a.c/jours).toFixed(2).padStart(7)}`);
  }
  // detail specialite
  const spec = rows.filter(r => typ((r.keys||[])[0]||"") === "metier-specialite-ville").sort((a,b)=>(b.impressions||0)-(a.impressions||0));
  console.log(`\n--- Top 15 pages specialite par impressions (sur ${spec.length} pages vues) ---`);
  for (const r of spec.slice(0,15)) console.log(`  ${String(r.impressions).padStart(5)} imp | ${String(r.clicks).padStart(3)} clics | pos ${(r.position||0).toFixed(1).padStart(5)} | ${(r.keys||[])[0]}`);
}
main().catch(e=>{console.error("ERREUR", e.message); process.exit(1);});
