import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-05", E = "2026-09-01";
function pat(u: string) {
  const p = u.replace("https://workwave.fr","");
  if (p === "/" || p === "") return "/ (home)";
  if (p.startsWith("/artisan/")) return "/artisan/[slug]";
  if (p.startsWith("/guide-des-prix/")) return "/guide-des-prix";
  if (p.startsWith("/trouver-des-chantiers/")) return "/trouver-des-chantiers";
  if (p.startsWith("/trouver-des-clients/")) return "/trouver-des-clients";
  if (p.startsWith("/blog/")) return "/blog";
  if (p.startsWith("/ai/") || p.startsWith("/en/")) return "/ai|/en";
  if (p.startsWith("/barometre")) return "/barometre";
  const seg = p.split("?")[0].split("/").filter(Boolean);
  if (seg.length === 1) return "/[metier] ou page fixe";
  if (seg.length === 2) return /-\d{2,3}$/.test(seg[1]) ? "/[metier]/[dept-NN]" : "/[metier]/[ville]";
  if (seg.length === 3) return "/[metier]/[specialite]/[ville]";
  return "autre";
}
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let all: any[] = [];
  for (let start = 0; start < 200000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
  }
  console.log(`pages avec impressions (${S} -> ${E}) :`, all.length);

  // 1. bucket CTR pour le SEUL gabarit /[metier]/[ville]
  const buckets = ["1-3","4-10","11-20","21+"];
  const mk = () => Object.fromEntries(buckets.map(b=>[b,[0,0,0]])) as Record<string, number[]>;
  const strict = mk(), audit = mk();
  let iV=0,cV=0,posw=0,nV=0;
  for (const r of all) {
    const u = r.keys![0], k = pat(u), p = r.position||0, i = r.impressions||0, c = r.clicks||0;
    const b = p<=3?"1-3":p<=10?"4-10":p<=20?"11-20":"21+";
    if (k === "/[metier]/[ville]") { strict[b][0]+=i; strict[b][1]+=c; strict[b][2]++; iV+=i; cV+=c; posw+=p*i; nV++; }
    // reproduction du filtre de l'audit (_gab-gsc5.ts)
    if (!/\/artisan\/|\/guide-des-prix\/|\/blog\/|\/ai\/|\/en\//.test(u)) { audit[b][0]+=i; audit[b][1]+=c; audit[b][2]++; }
  }
  console.log(`\n=== A. /[metier]/[ville] STRICT : ${nV} pages, ${iV} impr, ${cV} clics, pos.moy(pond) ${(posw/Math.max(iV,1)).toFixed(1)}, CTR ${(100*cV/Math.max(iV,1)).toFixed(2)}% ===`);
  console.log(`   impr/jour ${(iV/28).toFixed(0)} | clics/jour ${(cV/28).toFixed(1)}`);
  for (const b of buckets) console.log(`  pos ${b.padEnd(6)} : ${String(strict[b][2]).padStart(6)} pages | ${String(strict[b][0]).padStart(7)} impr | ${String(strict[b][1]).padStart(5)} clics | CTR ${(100*strict[b][1]/Math.max(strict[b][0],1)).toFixed(2)}%`);
  console.log(`\n=== B. Le bucket "listings" DE L'AUDIT (filtre par exclusion) ===`);
  for (const b of buckets) console.log(`  pos ${b.padEnd(6)} : ${String(audit[b][2]).padStart(6)} pages | ${String(audit[b][0]).padStart(7)} impr | ${String(audit[b][1]).padStart(5)} clics | CTR ${(100*audit[b][1]/Math.max(audit[b][0],1)).toFixed(2)}%`);

  // 2. qui pollue le bucket 11-20 de l'audit ?
  console.log(`\n=== C. Composition du bucket 11-20 de l'audit, par gabarit (top clics) ===`);
  const comp: Record<string,{i:number,c:number,n:number}> = {};
  for (const r of all) {
    const u=r.keys![0], p=r.position||0;
    if (p<=10 || p>20) continue;
    if (/\/artisan\/|\/guide-des-prix\/|\/blog\/|\/ai\/|\/en\//.test(u)) continue;
    const k=pat(u); comp[k] ??= {i:0,c:0,n:0}; comp[k].i+=r.impressions||0; comp[k].c+=r.clicks||0; comp[k].n++;
  }
  for (const [k,v] of Object.entries(comp).sort((a,b)=>b[1].c-a[1].c))
    console.log(`  ${k.padEnd(30)} ${String(v.n).padStart(6)} pages | ${String(v.i).padStart(7)} impr | ${String(v.c).padStart(5)} clics | CTR ${(100*v.c/Math.max(v.i,1)).toFixed(2)}%`);
}
main().catch(e=>console.error(e.message));
