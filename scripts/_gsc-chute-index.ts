/**
 * Diagnostic de la chute d'index du 20-28/08/2026 (567 k -> 186 k pages).
 * Le rapport de couverture n'est pas exposé par l'API : on mesure donc sur un
 * échantillon. Pages qui recevaient des clics AVANT la chute et n'apparaissent
 * plus APRÈS -> inspection URL -> répartition des motifs réels.
 * Usage : npx tsx scripts/_gsc-chute-index.ts
 */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
const sc = google.searchconsole({ version: "v1", auth });

async function pages(startDate: string, endDate: string) {
  const out = new Map<string, { clics: number; imp: number }>();
  for (let startRow = 0; ; startRow += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate, endDate, dimensions: ["page"], rowLimit: 25000, startRow } });
    const rows = r.data.rows || [];
    for (const row of rows) out.set(row.keys![0], { clics: row.clicks || 0, imp: row.impressions || 0 });
    if (rows.length < 25000) break;
  }
  return out;
}
function type(u: string) {
  const p = u.replace(SITE, "/");
  if (p.startsWith("/artisan/")) return "fiche artisan";
  if (p.startsWith("/guide-des-prix")) return "guide de prix";
  if (p.startsWith("/blog")) return "blog";
  if (p.startsWith("/ai")) return "ai";
  if (/^\/[^/]+\/[^/]+-\d{2,3}$/.test(p)) return "metier x departement";
  if (/^\/[^/]+\/[^/]+$/.test(p)) return "metier x ville";
  if (/^\/[^/]+$/.test(p)) return "metier (racine) ou autre";
  return "autre";
}
async function inspecter(u: string) {
  try {
    const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: SITE } });
    const r = data.inspectionResult?.indexStatusResult || {};
    return { etat: `${r.coverageState}`, verdict: r.verdict, fetch: r.pageFetchState, crawl: r.lastCrawlTime?.slice(0, 10) || "jamais", canon: r.googleCanonical === r.userCanonical ? "ok" : `google=${r.googleCanonical}` };
  } catch (e) { return { etat: `ERREUR ${(e as Error).message.slice(0, 60)}`, verdict: "", fetch: "", crawl: "", canon: "" }; }
}
async function main() {
  const avant = await pages("2026-07-25", "2026-08-14");
  const apres = await pages("2026-08-25", "2026-08-31");
  console.log(`pages avec impressions : AVANT (25/07-14/08) ${avant.size} · APRÈS (25-31/08) ${apres.size}`);
  const disparues = [...avant].filter(([u, v]) => v.clics >= 2 && !apres.has(u)).map(([u]) => u);
  const clicsPerdus = [...avant].filter(([u]) => !apres.has(u)).reduce((s, [, v]) => s + v.clics, 0);
  console.log(`pages avec >=2 clics AVANT et 0 impression APRÈS : ${disparues.length} (clics perdus sur 3 semaines toutes pages confondues : ${clicsPerdus})`);
  const parType: Record<string, number> = {};
  for (const u of disparues) parType[type(u)] = (parType[type(u)] || 0) + 1;
  console.log("  par type :", parType);

  // Échantillon stratifié : jusqu'à 18 par type, 90 max.
  const ech: string[] = [];
  const vus: Record<string, number> = {};
  for (const u of disparues.sort(() => Math.random() - 0.5)) { const t = type(u); if ((vus[t] || 0) < 18) { vus[t] = (vus[t] || 0) + 1; ech.push(u); } if (ech.length >= 90) break; }
  const temoin = [...apres].filter(([, v]) => v.clics >= 3).map(([u]) => u).sort(() => Math.random() - 0.5).slice(0, 20);

  console.log(`\ninspection de ${ech.length} pages disparues + ${temoin.length} témoins (encore cliquées)...`);
  const res: Record<string, Record<string, number>> = {};
  const crawlRecent: Record<string, number> = {};
  const exemples: Record<string, string[]> = {};
  async function lot(liste: string[], label: string) {
    let i = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (i < liste.length) {
        const u = liste[i++];
        const r = await inspecter(u);
        const k = r.etat + (r.fetch && r.fetch !== "SUCCESSFUL" ? ` [fetch ${r.fetch}]` : "") + (r.canon !== "ok" ? " [canonique différente]" : "");
        res[label] ??= {}; res[label][k] = (res[label][k] || 0) + 1;
        if (label === "disparues") { const b = r.crawl >= "2026-08-20" ? "crawl après le 20/08" : r.crawl >= "2026-08-01" ? "crawl 01-19/08" : "crawl avant août ou jamais"; crawlRecent[b] = (crawlRecent[b] || 0) + 1; }
        (exemples[k] ??= []).length < 2 && exemples[k].push(`${u.replace(SITE, "/")} (crawl ${r.crawl})`);
      }
    }));
  }
  await lot(ech, "disparues");
  await lot(temoin, "temoins");
  for (const [label, d] of Object.entries(res)) {
    console.log(`\n=== ${label} ===`);
    for (const [k, n] of Object.entries(d).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${k}`);
  }
  console.log("\ndernier crawl des disparues :", crawlRecent);
  console.log("\nexemples :"); for (const [k, l] of Object.entries(exemples)) console.log(`  ${k}\n     ${l.join("\n     ")}`);
}
main();
