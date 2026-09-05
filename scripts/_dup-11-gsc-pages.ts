/** MESURE 9 : quelles familles de pages RESSORTENT reellement dans Google.
 *  Search Analytics, dimension page, 28 derniers jours. Une page qui n'apparait
 *  jamais ici n'a pas rapporte une seule impression. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
function famille(u: string): string {
  const p = u.replace("https://workwave.fr", "").split("?")[0];
  if (p === "/" || p === "") return "accueil";
  if (p.startsWith("/artisan/")) return "fiche pro /artisan/";
  if (p.startsWith("/guide-des-prix/")) return "guide des prix";
  if (p.startsWith("/trouver-des-chantiers/")) return "trouver-des-chantiers";
  if (p.startsWith("/trouver-des-clients/")) return "trouver-des-clients";
  if (p.startsWith("/blog/")) return "blog";
  if (p.startsWith("/barometre")) return "barometre";
  if (p.startsWith("/ai/") || p.startsWith("/en/")) return "vertical tech /ai/";
  const seg = p.split("/").filter(Boolean);
  if (seg.length === 1) return "racine metier /[metier]";
  if (seg.length === 2) return /-\d{2,3}$/.test(seg[1]) ? "listing metier x DEPARTEMENT" : "listing metier x COMMUNE";
  if (seg.length === 3) return "listing metier x specialite x commune";
  return "autre";
}
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const fin = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
  const debut = new Date(Date.now() - 31 * 864e5).toISOString().slice(0, 10);
  const agg = new Map<string, { p: number; imp: number; clics: number; pos: number }>();
  let start = 0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: debut, endDate: fin, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = data.rows || []; if (!rows.length) break;
    for (const r of rows) {
      const f = famille(r.keys![0]);
      const a = agg.get(f) || { p: 0, imp: 0, clics: 0, pos: 0 };
      a.p++; a.imp += r.impressions || 0; a.clics += r.clicks || 0; a.pos += (r.position || 0) * (r.impressions || 0);
      agg.set(f, a);
    }
    start += rows.length; if (rows.length < 25000) break;
  }
  console.log(`periode ${debut} -> ${fin}\n`);
  console.log("famille de page                          pages vues  impressions   clics   position moy.");
  let tp = 0, ti = 0, tc = 0;
  [...agg.entries()].sort((a, b) => b[1].imp - a[1].imp).forEach(([f, a]) => {
    tp += a.p; ti += a.imp; tc += a.clics;
    console.log(`${f.padEnd(40)} ${String(a.p).padStart(9)} ${String(a.imp).padStart(12)} ${String(a.clics).padStart(7)}   ${(a.pos / Math.max(a.imp,1)).toFixed(1).padStart(6)}`);
  });
  console.log(`${"TOTAL".padEnd(40)} ${String(tp).padStart(9)} ${String(ti).padStart(12)} ${String(tc).padStart(7)}`);
})();
