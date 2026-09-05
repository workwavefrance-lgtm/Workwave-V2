import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-06-04", E = "2026-09-02";
const RE = /(chantier|trouver des client|trouver du travail|trouver des mission|apport d.?affaire|apporteur|prospect|se faire connaitre|se faire connaître|devenir (auto ?)?entrepreneur|inscription artisan|artisan inscription|plateforme (pour )?(les )?(artisan|pro|travaux|btp)|site pour artisan|pour (les )?artisans|sous.?trait|appel.? d.?offre|devis a? faire|recevoir des devis|demande de devis pro|lead|clients? btp|carnet de commande|remplir mon planning|je suis (artisan|plombier|peintre|macon|maçon|electricien|électricien))/i;
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let all: any[] = [];
  for (let start = 0; start < 75000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || [];
    all.push(...rows);
    if (rows.length < 25000) break;
  }
  console.log(`Total requetes distinctes remontees par GSC (${S} -> ${E}) : ${all.length}`);
  const totImp = all.reduce((a,x)=>a+(x.impressions||0),0), totClk = all.reduce((a,x)=>a+(x.clicks||0),0);
  console.log(`Total impressions : ${totImp} · clics : ${totClk}`);
  const pro = all.filter(r => RE.test(r.keys[0]) && !/workwave|work wave/i.test(r.keys[0]));
  const pImp = pro.reduce((a,x)=>a+(x.impressions||0),0), pClk = pro.reduce((a,x)=>a+(x.clicks||0),0);
  console.log(`\n=== Requetes a INTENTION PRO (hors marque) : ${pro.length} requetes, ${pImp} imp (${(100*pImp/totImp).toFixed(2)}% du total), ${pClk} clics ===`);
  pro.sort((a,b)=>(b.impressions||0)-(a.impressions||0));
  for (const r of pro.slice(0,60))
    console.log(`   pos ${(r.position||0).toFixed(1).padStart(5)} | ${String(r.impressions).padStart(5)} imp | ${String(r.clicks).padStart(3)} clics | ${r.keys[0]}`);
  const portee = pro.filter(r => (r.position||99) >= 4 && (r.position||99) <= 20);
  console.log(`\n=== Dont A PORTEE (position 4 a 20) : ${portee.length} requetes, ${portee.reduce((a,x)=>a+(x.impressions||0),0)} imp ===`);
  for (const r of portee.sort((a,b)=>(b.impressions||0)-(a.impressions||0)))
    console.log(`   pos ${(r.position||0).toFixed(1).padStart(5)} | ${String(r.impressions).padStart(5)} imp | ${r.keys[0]}`);
  // requetes marque a intention pro
  const marque = all.filter(r => /workwave|work wave/i.test(r.keys[0]));
  console.log(`\n=== Requetes DE MARQUE : ${marque.length} requetes, ${marque.reduce((a,x)=>a+(x.impressions||0),0)} imp, ${marque.reduce((a,x)=>a+(x.clicks||0),0)} clics ===`);
  for (const r of marque.sort((a,b)=>(b.impressions||0)-(a.impressions||0)).slice(0,20))
    console.log(`   pos ${(r.position||0).toFixed(1).padStart(5)} | ${String(r.impressions).padStart(5)} imp | ${String(r.clicks).padStart(3)} clics | ${r.keys[0]}`);
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
