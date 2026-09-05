import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-05", E = "2026-09-01";

type Row = { keys?: string[] | null; clicks?: number | null; impressions?: number | null; position?: number | null };

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });

  // Toutes les pages avec au moins 1 impression sur la fenetre, paginees
  const toutes: Row[] = [];
  for (let start = 0; start < 25000; start += 5000) {
    const r = await sc.searchanalytics.query({
      siteUrl: SITE,
      requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 5000, startRow: start },
    });
    const rows = (r.data.rows || []) as Row[];
    toutes.push(...rows);
    if (rows.length < 5000) break;
  }
  console.log(`fenetre ${S} -> ${E}`);
  console.log(`pages avec >=1 impression : ${toutes.length}`);

  const fam = (u: string) => {
    const p = u.replace("https://workwave.fr", "").split("?")[0].split("/").filter(Boolean);
    const u2 = "/" + p.join("/");
    if (u2.startsWith("/artisan/")) return "artisan";
    if (u2.startsWith("/guide-des-prix/")) return "guide-des-prix";
    if (u2.startsWith("/blog/")) return "blog-article";
    if (u2 === "/blog") return "blog-hub";
    if (u2.startsWith("/trouver-des-chantiers/")) return /-\d{2,3}$/.test(p[1]) ? "chantiers-DEPT" : "chantiers-metier";
    if (u2 === "/trouver-des-chantiers") return "chantiers-hub";
    if (u2.startsWith("/trouver-des-clients")) return "clients";
    if (u2.startsWith("/ai") || u2.startsWith("/en/")) return "ai";
    if (u2.startsWith("/pro")) return "pro";
    if (u2.startsWith("/barometre")) return "barometre";
    if (p.length === 1) return "racine/fixe";
    if (p.length === 2) return /-\d{2,3}$/.test(p[1]) ? "metier/DEPT" : (["guide","prix","urgence","installation","obligation","location-saisonniere"].includes(p[1]) ? "metier/PILIER" : "metier/VILLE");
    if (p.length === 3) {
      if (["urgence","installation","obligation","location-saisonniere"].includes(p[1])) return "metier/INTENTION/ville";
      return "metier/SPECIALITE/ville";
    }
    return "autre";
  };

  const agg = new Map<string, { pages: number; clics: number; imps: number }>();
  for (const r of toutes) {
    const f = fam((r.keys || [""])[0]);
    const e = agg.get(f) || { pages: 0, clics: 0, imps: 0 };
    e.pages++; e.clics += r.clicks || 0; e.imps += r.impressions || 0;
    agg.set(f, e);
  }
  console.log("\nfamille | pages_avec_impressions | clics_28j | impressions_28j | clics/page/jour");
  for (const [f, e] of [...agg].sort((a, b) => b[1].imps - a[1].imps)) {
    console.log(`${f} | ${e.pages} | ${e.clics} | ${e.imps} | ${(e.clics / e.pages / 28).toFixed(4)}`);
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
