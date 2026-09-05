import { google } from "googleapis";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: await auth.getClient() as any });
  const site = "https://workwave.fr/";
  const rows: any[] = [];
  for (let s = 0; s < 400000; s += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000, startRow: s, type: "web" } });
    const d = r.data.rows || [];
    rows.push(...d);
    if (d.length < 25000) break;
  }
  const fam = (u: string) => {
    const p = new URL(u).pathname;
    if (p.startsWith("/artisan/")) return "fiche";
    if (p.startsWith("/guide-des-prix/")) return "guide-prix";
    if (p.startsWith("/blog")) return "blog";
    if (p.startsWith("/ai")) return "ai";
    if (p.startsWith("/trouver-des-")) return "pro";
    if (p.startsWith("/barometre")) return "barometre";
    const seg = p.split("/").filter(Boolean);
    if (seg.length === 3) return "specialite";
    if (seg.length === 2) return /-(\d{2,3}|2a|2b|bru|wbr|wht|wlg|wlx|wna)$/i.test(seg[1]) ? "listing-dept" : "listing-ville";
    if (seg.length === 1) return "racine-metier";
    return "autre";
  };
  const agg: Record<string, { pages: number; pagesClic: number; clics: number; imp: number; p1: number }> = {};
  let totC = 0, totI = 0, totP = 0, totPC = 0;
  for (const r of rows) {
    const f = fam(r.keys[0]);
    agg[f] ||= { pages: 0, pagesClic: 0, clics: 0, imp: 0, p1: 0 };
    agg[f].pages++; agg[f].clics += r.clicks; agg[f].imp += r.impressions;
    if (r.clicks > 0) agg[f].pagesClic++;
    if (r.clicks === 1) agg[f].p1++;
    totP++; totC += r.clicks; totI += r.impressions; if (r.clicks > 0) totPC++;
  }
  console.log(`TOTAL pages avec impressions ${totP} | pages avec >=1 clic ${totPC} | clics ${totC} | imp ${totI}`);
  console.log(`Taux conversion visible -> gagnante : ${(100*totPC/totP).toFixed(2)}% | clic/jour par page gagnante ${(totC/totPC/28).toFixed(4)} | clic/jour par page visible ${(totC/totP/28).toFixed(5)}`);
  console.log("famille | pages_vues | pages_a_clic | %conv | clics | clic/j/page_vue | pages_a_1clic");
  for (const [k, v] of Object.entries(agg).sort((a, b) => b[1].clics - a[1].clics))
    console.log(`${k} | ${v.pages} | ${v.pagesClic} | ${(100*v.pagesClic/v.pages).toFixed(1)}% | ${v.clics} | ${(v.clics/v.pages/28).toFixed(5)} | ${v.p1}`);
}
main();
