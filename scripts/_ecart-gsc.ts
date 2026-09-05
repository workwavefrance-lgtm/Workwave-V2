import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-01", E = "2026-08-31";

function fam(u: string): string {
  const p = u.replace("https://workwave.fr", "").split("?")[0];
  if (p === "/" || p === "") return "/ (home)";
  if (p.startsWith("/artisan/")) return "/artisan/[slug]";
  if (p.startsWith("/guide-des-prix/")) return "/guide-des-prix/";
  if (p.startsWith("/trouver-des-chantiers")) return "/trouver-des-chantiers/";
  if (p.startsWith("/trouver-des-clients")) return "/trouver-des-clients/";
  if (p.startsWith("/blog")) return "/blog/";
  if (p.startsWith("/barometre")) return "/barometre-*";
  if (p.startsWith("/ai/") || p.startsWith("/en/")) return "/ai|/en";
  if (p.startsWith("/verifier-artisan")) return "/verifier-artisan";
  if (p.startsWith("/deposer-projet")) return "/deposer-projet";
  if (p.startsWith("/pro")) return "/pro*";
  const seg = p.split("/").filter(Boolean);
  if (seg.length === 1) return "/[metier] (racine)";
  if (seg.length === 2) return /-\d{2,3}$/.test(seg[1]) ? "/[metier]/[dept]" : "/[metier]/[ville]";
  if (seg.length === 3) return "/[metier]/[specialite]/[ville]";
  return "autre:" + p;
}

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });

  // 1) par famille de page
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000 } });
  const agg = new Map<string, { c: number; i: number; n: number; ps: number }>();
  for (const row of r.data.rows || []) {
    const f = fam(row.keys![0]);
    const a = agg.get(f) || { c: 0, i: 0, n: 0, ps: 0 };
    a.c += row.clicks || 0; a.i += row.impressions || 0; a.n += 1; a.ps += (row.position || 0) * (row.impressions || 0);
    agg.set(f, a);
  }
  console.log(`\n=== ${S} -> ${E} : familles de pages (${(r.data.rows||[]).length} pages remontees, cap 25000) ===`);
  for (const [f, a] of [...agg].sort((x, y) => y[1].i - x[1].i))
    console.log(`${String(a.i).padStart(7)} imp | ${String(a.c).padStart(5)} clics | ${String(a.n).padStart(6)} pages | pos moy ${(a.ps/Math.max(a.i,1)).toFixed(1)} | ${f}`);

  // 2) requetes par motif d intention
  const rq = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000 } });
  const rows = rq.data.rows || [];
  const motifs: [string, RegExp][] = [
    ["prix / tarif / cout / devis", /\b(prix|tarif|co[uû]t|devis|combien)\b/i],
    ["avis / note / meilleur", /\b(avis|not[ée]|meilleur|classement|fiable|arnaque)\b/i],
    ["comment / guide / conseil", /\b(comment|pourquoi|guide|conseil|choisir|quel)\b/i],
    ["aide / subvention / prime", /\b(aide|prime|maprimerenov|subvention|cee|credit d)/i],
    ["urgence / depannage", /\b(urgen|depann|24h|nuit|dimanche)\b/i],
    ["pro : chantier / client / trouver", /\b(chantier|trouver des client|auto.?entrepreneur|se lancer|cr[ée]er son entreprise)\b/i],
    ["siret / verifier / rge", /\b(siret|siren|v[ée]rifi|rge|kbis|d[ée]cennale|assurance)\b/i],
    ["autour de moi / pres de chez", /(autour de moi|pr[eè]s de chez|proximit[ée]|a proximite)/i],
    ["nom d entreprise (marque tierce)", /\b(sarl|sas|eurl|entreprise)\b/i],
  ];
  console.log(`\n=== ${S} -> ${E} : requetes par motif d intention (${rows.length} requetes, cap 25000) ===`);
  let tc = 0, ti = 0;
  for (const row of rows) { tc += row.clicks || 0; ti += row.impressions || 0; }
  console.log(`TOTAL: ${ti} imp, ${tc} clics`);
  for (const [name, re] of motifs) {
    let c = 0, i = 0, n = 0, ps = 0;
    for (const row of rows) if (re.test(row.keys![0])) { c += row.clicks||0; i += row.impressions||0; n++; ps += (row.position||0)*(row.impressions||0); }
    console.log(`${String(i).padStart(7)} imp (${(100*i/Math.max(ti,1)).toFixed(1)}%) | ${String(c).padStart(4)} clics | ${String(n).padStart(5)} req | pos ${(ps/Math.max(i,1)).toFixed(1)} | ${name}`);
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
