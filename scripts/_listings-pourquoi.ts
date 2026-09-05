/**
 * Pourquoi les listings metier x lieu cliquent a 2,25 % quand les fiches
 * cliquent a 5,87 % ? Deux hypotheses a departager :
 *   A. le texte servi en resultat ne donne pas envie (reparable) ;
 *   B. ils sortent sur des requetes ou un annuaire n'est pas la reponse
 *      attendue (non reparable par le texte).
 */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });

  // Les listings a plus fortes impressions.
  const rows: any[] = [];
  for (let startRow = 0; ; startRow += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000, startRow } });
    const d = r.data.rows || []; rows.push(...d); if (d.length < 25000) break;
  }
  const listings = rows
    .filter((x) => { const p = x.keys[0].replace(SITE, "/"); return p.split("/").filter(Boolean).length === 2 && !p.startsWith("/artisan/") && !p.startsWith("/ai/") && !p.startsWith("/blog/") && !p.startsWith("/en/"); })
    .sort((a, b) => b.impressions - a.impressions);
  console.log("les 10 listings a plus fortes impressions :");
  for (const x of listings.slice(0, 10)) {
    console.log(`  ${String(x.impressions).padStart(5)} imp · ${String(x.clicks).padStart(3)} clics · CTR ${(x.clicks / x.impressions * 100).toFixed(1).padStart(4)} % · pos ${Math.round((x.position || 0) * 10) / 10} · ${x.keys[0].replace(SITE, "/")}`);
  }

  // Les requetes de ces listings, toutes confondues.
  const r2 = await sc.searchanalytics.query({
    siteUrl: SITE,
    requestBody: {
      startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["query"], rowLimit: 25000,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "includingRegex", expression: "^https://workwave\\.fr/[a-z-]+/[a-z0-9-]+$" }] }],
    },
  });
  const q = (r2.data.rows || []).sort((a: any, b: any) => b.impressions - a.impressions);
  const qi = q.reduce((s: number, x: any) => s + x.impressions, 0), qc = q.reduce((s: number, x: any) => s + x.clicks, 0);
  console.log(`\n${q.length} requetes · ${qi} impressions · ${qc} clics · CTR ${(qc / qi * 100).toFixed(2)} %`);
  console.log("\nles 25 requetes a plus fortes impressions :");
  for (const x of q.slice(0, 25)) {
    console.log(`  ${String(x.impressions).padStart(5)} imp · ${String(x.clicks).padStart(3)} clics · CTR ${(x.clicks / x.impressions * 100).toFixed(1).padStart(4)} % · pos ${(Math.round((x.position || 0) * 10) / 10).toString().padStart(4)} · "${x.keys[0]}"`);
  }
})();
