import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SPE = new Set("depannage debouchage chauffe-eau sanitaire fuite renovation-salle-de-bain pose-robinetterie mise-aux-normes tableau-electrique domotique renovation pompe-a-chaleur chaudiere entretien remplacement sur-mesure fenetre porte cuisine agencement extension construction-neuve mur-cloture terrassement interieur exterieur ravalement decoratif tapisserie salle-de-bain terrasse sol-pvc faience creation-jardin elagage arrosage".split(" "));
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  for (const [S,E] of [["2026-08-05","2026-09-01"],["2026-07-01","2026-07-31"]]) {
    const rows: any[] = []; let start = 0;
    while (true) {
      const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start } });
      const rr = r.data.rows || []; if (!rr.length) break; rows.push(...rr); start += rr.length; if (rr.length < 25000) break;
    }
    const spe = rows.filter(r => { const s = r.keys[0].replace("https://workwave.fr","").split("/").filter(Boolean); return s.length===3 && SPE.has(s[1]); });
    const tot = rows.reduce((s,r)=>s+r.clicks,0);
    console.log(`${S} -> ${E} : specialite x ville = ${spe.length} pages vues | ${spe.reduce((s,r)=>s+r.impressions,0)} imp | ${spe.reduce((s,r)=>s+r.clicks,0)} clics  ||  site entier ${tot} clics`);
  }
})();
