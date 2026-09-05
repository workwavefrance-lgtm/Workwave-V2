import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-06-04", E = "2026-09-02";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let all: any[] = [];
  for (let start = 0; start < 100000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
  }
  console.log(`Total requetes distinctes remontees par GSC (${S} -> ${E}) : ${all.length}`);
  const totImp = all.reduce((a,x)=>a+(x.impressions||0),0);
  const totClk = all.reduce((a,x)=>a+(x.clicks||0),0);
  console.log(`Total impressions ${totImp} | clics ${totClk}\n`);

  // 1. Toutes marques concurrentes connues, larges
  const MARQUES = /(habitatpresto|habitat presto|travaux\.?com|travaux com|starofservice|star of service|quotatis|hemea|allotravaux|allo travaux|chantierhero|chantier hero|chantier-facile|chantier facile|travauxninja|travaux ninja|travauxnow|travaux now|leboncoin pro|obat|tolteck|batiactu|edilkamin|mesdepanneurs|izi by edf|frizbiz|allovoisins|needhelp|yoojo|jemepropose|hellocasa|travauxlib|travaux lib|3dbat|bricoprive)/i;
  const marque = all.filter(r => MARQUES.test(r.keys[0]));
  const mi = marque.reduce((a,x)=>a+(x.impressions||0),0), mc = marque.reduce((a,x)=>a+(x.clicks||0),0);
  console.log(`=== REQUETES DE MARQUE CONCURRENTE (regex large) : ${marque.length} requetes | ${mi} imp | ${mc} clics ===`);
  for (const r of marque.sort((a,b)=>(b.impressions||0)-(a.impressions||0)))
    console.log(`  pos ${(r.position||0).toFixed(1).padStart(5)} | ${String(r.impressions).padStart(4)} imp | ${String(r.clicks).padStart(2)} clics | ${r.keys[0]}`);

  // 2. Les 7 requetes citees par l'audit, verbatim
  console.log(`\n=== LES 7 REQUETES CITEES PAR L'AUDIT (verbatim) ===`);
  const cites = ["chantierhero.fr carreleur","chantierhero macon","chantierhero.fr menuisier","rejoindre travauxnow","rejoindre travauxninja","chantier-facile.fr marseille","plateforme travaux"];
  let sumImp = 0;
  for (const q of cites) {
    const h = all.find(r => r.keys[0].trim().toLowerCase() === q);
    if (h) { sumImp += h.impressions||0; console.log(`  TROUVEE  pos ${(h.position||0).toFixed(1).padStart(5)} | ${h.impressions} imp | ${h.clicks} clics | "${q}"`); }
    else console.log(`  ABSENTE  (0 impression sur la periode)                    | "${q}"`);
  }
  console.log(`  -> somme impressions des requetes citees : ${sumImp}`);

  // 3. Requetes "sans abonnement" / "sans commission" (l'angle des pages)
  console.log(`\n=== ANGLE 'SANS ABONNEMENT / SANS COMMISSION / ALTERNATIVE' ===`);
  const ANGLE = /(sans abonnement|sans commission|alternative)/i;
  const ang = all.filter(r => ANGLE.test(r.keys[0]));
  const ai = ang.reduce((a,x)=>a+(x.impressions||0),0);
  console.log(`  ${ang.length} requetes | ${ai} impressions`);
  for (const r of ang.sort((a,b)=>(b.impressions||0)-(a.impressions||0)).slice(0,20))
    console.log(`  pos ${(r.position||0).toFixed(1).padStart(5)} | ${String(r.impressions).padStart(4)} imp | ${String(r.clicks).padStart(2)} clics | ${r.keys[0]}`);
})();
