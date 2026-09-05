import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  let all: any[] = [];
  for (let start = 0; start < 100000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
  }
  console.log("pages avec impressions :", all.length);
  const pat = (u: string) => {
    const p = u.replace("https://workwave.fr","");
    if (p === "/") return "/ (home)";
    if (p.startsWith("/artisan/")) return "/artisan/[slug]";
    if (p.startsWith("/guide-des-prix/")) return "/guide-des-prix/[slug]";
    if (p.startsWith("/trouver-des-chantiers/")) return "/trouver-des-chantiers/[slug]";
    if (p.startsWith("/blog/")) return "/blog/[slug]";
    if (p.startsWith("/ai/") || p.startsWith("/en/")) return "/ai|/en";
    const seg = p.split("/").filter(Boolean);
    if (seg.length === 1) return "/[metier]";
    if (seg.length === 2) return /-\d{2,3}$/.test(seg[1]) ? "/[metier]/[dept-NN]" : "/[metier]/[ville]";
    if (seg.length === 3) return "/[metier]/[specialite]/[ville]";
    return "autre";
  };
  const agg: Record<string, {p:number,i:number,c:number,n:number,posw:number}> = {};
  for (const r of all) {
    const k = pat(r.keys![0]);
    agg[k] ??= {p:0,i:0,c:0,n:0,posw:0};
    agg[k].i += r.impressions||0; agg[k].c += r.clicks||0; agg[k].n++;
    agg[k].posw += (r.position||0)*(r.impressions||0);
  }
  console.log("\ngabarit".padEnd(30), "pages".padStart(7), "impr".padStart(8), "clics".padStart(6), "pos.moy(pond.impr)".padStart(20), "CTR");
  for (const [k,v] of Object.entries(agg).sort((a,b)=>b[1].i-a[1].i))
    console.log(k.padEnd(30), String(v.n).padStart(7), String(v.i).padStart(8), String(v.c).padStart(6), (v.posw/Math.max(v.i,1)).toFixed(1).padStart(20), ((100*v.c)/Math.max(v.i,1)).toFixed(2)+"%");
}
main().catch(e=>console.error(e.message));
