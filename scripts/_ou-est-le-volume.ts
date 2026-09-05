/**
 * Ou est le volume : repartition des impressions et des clics par position,
 * et par famille d'URL. Sert a choisir le levier (CTR, position, ou volume de
 * pages indexees) sur des chiffres, pas au jugé.
 */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const rows: any[] = [];
  for (let startRow = 0; ; startRow += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000, startRow } });
    const d = r.data.rows || []; rows.push(...d); if (d.length < 25000) break;
  }
  const cl = rows.reduce((s, x) => s + (x.clicks || 0), 0);
  const im = rows.reduce((s, x) => s + (x.impressions || 0), 0);
  console.log(`28 jours · ${rows.length} pages avec au moins 1 impression`);
  console.log(`${cl} clics · ${im} impressions · CTR ${(cl / im * 100).toFixed(2)} % · ${(cl / 28).toFixed(0)} clics par jour\n`);

  const seuils = [[1, 3], [3, 5], [5, 11], [11, 21], [21, 51], [51, 999]];
  console.log("par tranche de position :");
  console.log("  tranche      pages   impressions      clics    CTR     part des impressions");
  for (const [a, b] of seuils) {
    const g = rows.filter((x) => (x.position || 999) >= a && (x.position || 999) < b);
    const gi = g.reduce((s, x) => s + x.impressions, 0), gc = g.reduce((s, x) => s + x.clicks, 0);
    console.log(`  ${String(a).padStart(3)}-${String(b - 1).padEnd(4)} ${String(g.length).padStart(9)} ${String(gi).padStart(13)} ${String(gc).padStart(10)}  ${(gi ? gc / gi * 100 : 0).toFixed(2).padStart(5)} %   ${(gi / im * 100).toFixed(1).padStart(5)} %`);
  }

  const famille = (u: string) => {
    const p = u.replace(SITE, "/");
    if (p.startsWith("/artisan/")) return "fiche artisan";
    if (p.startsWith("/ai/") || p.startsWith("/en/")) return "workwave ai";
    if (p.startsWith("/blog/")) return "blog";
    if (p.startsWith("/guide-des-prix")) return "guide des prix";
    if (p.startsWith("/trouver-des-chantiers")) return "acquisition pro";
    const n = p.split("/").filter(Boolean).length;
    if (n === 1) return "racine metier";
    if (n === 2) return "listing metier x lieu";
    return `autre (${n} niveaux)`;
  };
  const par: Record<string, { p: number; i: number; c: number }> = {};
  for (const x of rows) {
    const f = famille(x.keys[0]);
    (par[f] ||= { p: 0, i: 0, c: 0 });
    par[f].p++; par[f].i += x.impressions; par[f].c += x.clicks;
  }
  console.log("\npar famille de page :");
  console.log("  famille                   pages   impressions      clics    CTR");
  for (const [f, v] of Object.entries(par).sort((a, b) => b[1].i - a[1].i)) {
    console.log(`  ${f.padEnd(22)} ${String(v.p).padStart(8)} ${String(v.i).padStart(13)} ${String(v.c).padStart(10)}  ${(v.i ? v.c / v.i * 100 : 0).toFixed(2).padStart(5)} %`);
  }
})();
