import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-06-04", E = "2026-09-02";

const MOTS = [
  "chantier","chantiers","trouver des clients","trouver client","devis client",
  "plateforme artisan","artisan inscription","inscription artisan","sous-traitance","sous traitance",
  "appel d offre","appels d offres","appel d'offre","recuperer des clients","trouver des chantiers",
  "prospection","lead","leads","apporteur d affaire","auto entrepreneur batiment",
  "je suis artisan","pour artisan","pour les artisans","artisan pro","devenir artisan",
  "se faire connaitre","trouver du travail","trouver des missions","mission","freelance",
];

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });

  for (const m of MOTS) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["query"], rowLimit: 100,
      dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "contains", expression: m }] }],
    }});
    const rows = r.data.rows || [];
    if (!rows.length) continue;
    const totImp = rows.reduce((a,x)=>a+(x.impressions||0),0);
    const totClk = rows.reduce((a,x)=>a+(x.clicks||0),0);
    console.log(`\n### "${m}" -> ${rows.length} requetes, ${totImp} imp, ${totClk} clics`);
    for (const row of rows.slice(0,12))
      console.log(`   pos ${(row.position||0).toFixed(1).padStart(5)} | ${String(row.impressions).padStart(6)} imp | ${String(row.clicks).padStart(4)} clics | ${(row.keys||[]).join("")}`);
  }
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
