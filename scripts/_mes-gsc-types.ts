import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
function typeDe(u: string): string {
  const p = u.replace(/^https:\/\/workwave\.fr/, "").split("?")[0];
  if (p === "/" || p === "") return "accueil";
  if (p.startsWith("/artisan/")) return "fiche artisan";
  if (p.startsWith("/guide-des-prix/")) return "guide des prix";
  if (p.startsWith("/trouver-des-")) return "trouver-des-*";
  if (p.startsWith("/blog")) return "blog";
  if (p.startsWith("/ai/")) return "ai";
  if (p.startsWith("/barometre")) return "barometre";
  if (/^\/[^/]+\/[^/]+\/page\/\d+$/.test(p)) return "listing pagine";
  if (/^\/[^/]+\/[^/]+\/[^/]+$/.test(p)) return "listing specialite";
  if (/^\/[^/]+\/[^/]+-\d{2,3}$/.test(p)) return "listing metier x dept";
  if (/^\/[^/]+\/[^/]+$/.test(p)) return "listing metier x ville";
  if (/^\/[^/]+$/.test(p)) return "racine metier / page fixe";
  return "autre";
}
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const fin = new Date(Date.now() - 3*86400e3).toISOString().slice(0,10);
  const debut = new Date(Date.now() - 31*86400e3).toISOString().slice(0,10);
  const { data } = await sc.searchanalytics.query({ siteUrl: site, requestBody: {
    startDate: debut, endDate: fin, dimensions: ["page"], rowLimit: 25000 } });
  const rows = data.rows || [];
  console.log(`fenetre ${debut} -> ${fin} · ${rows.length} pages avec au moins 1 impression`);
  const agg: Record<string, {p:number,c:number,i:number}> = {};
  for (const r of rows) {
    const t = typeDe(r.keys![0]);
    agg[t] = agg[t] || {p:0,c:0,i:0};
    agg[t].p++; agg[t].c += r.clicks || 0; agg[t].i += r.impressions || 0;
  }
  const tc = Object.values(agg).reduce((a,b)=>a+b.c,0);
  console.log("\ntype                        pages    clics   %clics   impressions");
  for (const [k,v] of Object.entries(agg).sort((a,b)=>b[1].c-a[1].c))
    console.log(`${k.padEnd(26)} ${String(v.p).padStart(6)} ${String(v.c).padStart(8)} ${(100*v.c/tc).toFixed(1).padStart(7)}% ${String(v.i).padStart(12)}`);
  console.log(`${"TOTAL".padEnd(26)} ${String(rows.length).padStart(6)} ${String(tc).padStart(8)}`);
})();
