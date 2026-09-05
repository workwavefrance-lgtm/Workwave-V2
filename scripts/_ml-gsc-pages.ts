import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const site = "https://workwave.fr/";
  const { data } = await sc.searchanalytics.query({ siteUrl: site, requestBody: {
    startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000 } });
  const rows = data.rows || [];
  const fam = new Map<string, { c: number; i: number; n: number }>();
  const f = (u: string) => {
    const p = u.replace("https://workwave.fr", "");
    if (p.startsWith("/artisan/")) return "/artisan/[slug]";
    if (p.startsWith("/guide-des-prix")) return "/guide-des-prix/*";
    if (p.startsWith("/trouver-des")) return "/trouver-des-*";
    if (p.startsWith("/blog")) return "/blog/*";
    if (p.startsWith("/ai") || p.startsWith("/en/")) return "(ai)";
    if (p.startsWith("/pro")) return "/pro*";
    if (p.startsWith("/barometre")) return "/barometre-*";
    const s = p.split("/").filter(Boolean);
    if (!s.length) return "home";
    if (s.length === 1) return "/[metier] ou fixe";
    if (s.length === 2) return /-\d{2,3}$|-[a-z]{3}$/.test(s[1]) ? "/[metier]/[dept]" : "/[metier]/[ville]";
    return "/[metier]/x/[ville]";
  };
  for (const r of rows) {
    const k = f(r.keys![0]); const e = fam.get(k) || { c: 0, i: 0, n: 0 };
    e.c += r.clicks || 0; e.i += r.impressions || 0; e.n++; fam.set(k, e);
  }
  const tc = [...fam.values()].reduce((s, e) => s + e.c, 0);
  console.log(`=== GSC 05/08 -> 01/09 (28 j), ${rows.length} pages avec au moins 1 impression ===`);
  console.log("famille | pages | clics | impressions | part des clics");
  for (const [k, e] of [...fam].sort((a, b) => b[1].c - a[1].c))
    console.log(`${k} | ${e.n} | ${e.c} | ${e.i} | ${(100*e.c/tc).toFixed(1)} %`);
  console.log(`TOTAL | ${rows.length} | ${tc} | ${[...fam.values()].reduce((s,e)=>s+e.i,0)}`);
})();
