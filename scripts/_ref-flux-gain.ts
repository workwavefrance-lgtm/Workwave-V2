import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const j = (d: Date) => d.toISOString().slice(0,10);
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const fin = j(new Date(Date.now()-3*86400e3));
  const deb = j(new Date(Date.now()-31*86400e3));
  let rows: any[] = []; let start = 0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl: site, requestBody: {
      startDate: deb, endDate: fin, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const r = data.rows || []; rows.push(...r);
    if (r.length < 25000) break; start += r.length;
    if (start > 150000) break;
  }
  const fam = (u: string) => {
    const p = u.replace("https://workwave.fr","");
    if (p.startsWith("/artisan/")) return "fiche /artisan";
    if (p.startsWith("/trouver-des-chantiers")) return "/trouver-des-chantiers";
    if (p.startsWith("/guide-des-prix")) return "/guide-des-prix";
    if (p.startsWith("/blog")) return "/blog";
    if (p.startsWith("/ai")) return "/ai";
    if (p === "/" ) return "accueil";
    const seg = p.split("/").filter(Boolean);
    if (seg.length === 2) return "listing metier/lieu";
    if (seg.length === 1) return "racine metier";
    return "autre";
  };
  const agg: Record<string, {c:number;i:number;n:number}> = {};
  for (const r of rows) {
    const f = fam(r.keys![0]);
    agg[f] ||= {c:0,i:0,n:0};
    agg[f].c += r.clicks||0; agg[f].i += r.impressions||0; agg[f].n++;
  }
  console.log(`periode ${deb} -> ${fin} (28 j), ${rows.length} pages avec au moins 1 impression\n`);
  console.log("famille".padEnd(24), "pages".padStart(8), "clics".padStart(8), "impr.".padStart(10), "clics/page/jour".padStart(17));
  for (const [k,v] of Object.entries(agg).sort((a,b)=>b[1].c-a[1].c))
    console.log(k.padEnd(24), String(v.n).padStart(8), String(v.c).padStart(8), String(v.i).padStart(10), (v.c/v.n/28).toFixed(5).padStart(17));
})();
