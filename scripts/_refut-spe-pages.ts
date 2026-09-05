import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SPE = new Set("depannage debouchage chauffe-eau sanitaire fuite renovation-salle-de-bain pose-robinetterie mise-aux-normes tableau-electrique domotique renovation pompe-a-chaleur chaudiere entretien remplacement sur-mesure fenetre porte cuisine agencement extension construction-neuve mur-cloture terrassement interieur exterieur ravalement decoratif tapisserie salle-de-bain terrasse sol-pvc faience creation-jardin elagage arrosage".split(" "));
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const rows: any[] = []; let start = 0;
  while (true) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: "2026-08-01", endDate: "2026-08-31", dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rr = r.data.rows || []; if (!rr.length) break; rows.push(...rr); start += rr.length; if (rr.length < 25000) break;
  }
  const spe = rows.filter(r => { const s = r.keys[0].replace("https://workwave.fr", "").split("/").filter(Boolean); return s.length === 3 && SPE.has(s[1]); });
  spe.sort((a, b) => b.impressions - a.impressions);
  console.log(`pages specialite x ville AVEC au moins 1 impression : ${spe.length} (sur 3990 publiees = ${(spe.length/3990*100).toFixed(1)} %)`);
  console.log(`impressions totales : ${spe.reduce((s,r)=>s+r.impressions,0)} | clics : ${spe.reduce((s,r)=>s+r.clicks,0)}`);
  console.log(`rendement des pages VUES : ${(spe.reduce((s,r)=>s+r.impressions,0)/Math.max(spe.length,1)).toFixed(1)} impressions/page`);
  console.log("\ntop 10 :");
  for (const r of spe.slice(0, 10)) console.log(`  ${String(r.impressions).padStart(4)} imp | ${r.clicks} clics | pos ${r.position.toFixed(1)} | ${r.keys[0].replace("https://workwave.fr","")}`);
  const q = spe.filter(r => r.impressions === 1).length;
  console.log(`\npages a exactement 1 impression : ${q}/${spe.length}`);
})();
