import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-01", E = "2026-08-31";
const RE = /\b(aide|prime|maprimerenov|subvention|cee|credit d)/i;
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const all: any[] = [];
  for (let start = 0; start < 200000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query","page"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows);
    if (rows.length < 25000) break;
  }
  console.log(`couples query x page : ${all.length}`);
  const hits = all.filter(r => RE.test(r.keys![0]));
  let i=0,c=0; const parFam = new Map<string,{i:number,c:number,n:number}>();
  for (const r of hits) {
    i += r.impressions||0; c += r.clicks||0;
    const p = r.keys![1].replace("https://workwave.fr","").split("?")[0];
    const seg = p.split("/").filter(Boolean);
    let f = "autre";
    if (p==="/") f="/ (home)";
    else if (p.startsWith("/artisan/")) f="/artisan/[slug]";
    else if (p.startsWith("/guide-des-prix/")) f="/guide-des-prix/";
    else if (p.startsWith("/blog")) f="/blog/";
    else if (p.startsWith("/trouver-des-chantiers")) f="/trouver-des-chantiers/";
    else if (seg.length===1) f="/[metier] racine";
    else if (seg.length===2) f = /-\d{2,3}$/.test(seg[1]) ? "/[metier]/[dept]" : "/[metier]/[ville]";
    else if (seg.length===3) f="/[metier]/[spec]/[ville]";
    const a = parFam.get(f)||{i:0,c:0,n:0}; a.i+=r.impressions||0; a.c+=r.clicks||0; a.n++; parFam.set(f,a);
  }
  console.log(`\nintention aide/prime : ${i} impressions, ${c} clics, ${hits.length} couples`);
  console.log(`QUI porte deja cette intention :`);
  for (const [f,a] of [...parFam].sort((x,y)=>y[1].i-x[1].i)) console.log(`  ${String(a.i).padStart(5)} imp | ${a.c} clics | ${a.n} couples | ${f}`);
  console.log(`\ntop 15 requetes aide/prime :`);
  const parQ = new Map<string,{i:number,c:number,ps:number}>();
  for (const r of hits) { const q=r.keys![0]; const a=parQ.get(q)||{i:0,c:0,ps:0}; a.i+=r.impressions||0; a.c+=r.clicks||0; a.ps+=(r.position||0)*(r.impressions||0); parQ.set(q,a); }
  for (const [q,a] of [...parQ].sort((x,y)=>y[1].i-x[1].i).slice(0,15)) console.log(`  ${String(a.i).padStart(4)} imp | ${a.c} clics | pos ${(a.ps/Math.max(a.i,1)).toFixed(1)} | ${q}`);
  // combien de requetes contiennent explicitement RGE
  const rge = all.filter(r => /\brge\b/i.test(r.keys![0]));
  let ri=0, rc=0; for (const r of rge){ri+=r.impressions||0;rc+=r.clicks||0;}
  console.log(`\nrequetes contenant "RGE" : ${rge.length} couples, ${ri} impressions, ${rc} clics`);
  for (const r of rge.slice(0,10)) console.log(`   "${r.keys![0]}" -> ${r.impressions} imp, pos ${(r.position||0).toFixed(1)} | ${r.keys![1].replace("https://workwave.fr","")}`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
