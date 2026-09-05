import { google } from "googleapis";
// Classe les pages qui ont recu au moins 1 clic ou 1 impression sur 28 jours,
// par famille d URL, pour tester la base de calcul du gain annonce.
const DEBUT = "2026-08-05", FIN = "2026-09-01";
function famille(u: string): string {
  const p = new URL(u).pathname;
  if (p === "/") return "accueil";
  if (p.startsWith("/artisan/")) return "fiche pro";
  if (p.startsWith("/guide-des-prix/")) return "guide prix";
  if (p.startsWith("/blog/")) return "blog";
  if (p.startsWith("/trouver-des-chantiers/")) return "trouver-chantiers";
  if (p.startsWith("/ai/") || p.startsWith("/en/")) return "ai";
  const seg = p.split("/").filter(Boolean);
  if (seg.length === 1) return "racine metier";
  if (seg.length === 2) return /-\d{2,3}$/.test(seg[1]) ? "listing metier x DEPT" : "listing metier x VILLE";
  if (seg.length === 3) return "specialite x ville";
  return "autre";
}
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const rows: any[] = [];
  for (let start = 0; start < 25000; start += 5000) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: DEBUT, endDate: FIN, dimensions: ["page"], rowLimit: 5000, startRow: start } });
    const got = r.data.rows || [];
    rows.push(...got);
    if (got.length < 5000) break;
  }
  const agg: Record<string, { pages: number; clics: number; imp: number; pagesAvecClic: number }> = {};
  for (const r of rows) {
    const f = famille(r.keys![0]);
    agg[f] ||= { pages: 0, clics: 0, imp: 0, pagesAvecClic: 0 };
    agg[f].pages++; agg[f].clics += r.clicks; agg[f].imp += r.impressions;
    if (r.clicks > 0) agg[f].pagesAvecClic++;
  }
  console.log(`Fenetre ${DEBUT} -> ${FIN} (28 j), ${rows.length} pages remontees par GSC\n`);
  const lignes = Object.entries(agg).sort((a, b) => b[1].clics - a[1].clics);
  for (const [f, a] of lignes) {
    console.log(`${f.padEnd(24)} pages=${String(a.pages).padStart(6)} avecClic=${String(a.pagesAvecClic).padStart(5)} clics=${String(a.clics).padStart(5)} imp=${String(a.imp).padStart(7)} clics/page/j=${(a.clics / a.pages / 28).toFixed(4)}`);
  }
  const tot = lignes.reduce((s, [, a]) => s + a.clics, 0);
  console.log(`\nTOTAL clics 28 j : ${tot}`);
})();
