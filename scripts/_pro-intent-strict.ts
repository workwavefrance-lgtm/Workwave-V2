import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-06-04", E = "2026-09-02";
// Intention PRO STRICTE : l'artisan cherche du travail / une plateforme pour lui.
const STRICT = /(trouver (des |du |un )?chantier|chantier autour de moi|chantiers a proximite|plateforme travaux|plateforme pour artisan|site pour trouver des chantiers|trouver des client|apport de chantier|apporteur d.affaire|rejoindre (travaux|chantier)|chantierhero|chantier-facile|travauxninja|travauxnow|inscription artisan|artisan inscription|devenir partenaire|agence d.interim)/i;
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let all: any[] = [];
  for (let start = 0; start < 75000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
  }
  const pro = all.filter(r => STRICT.test(r.keys[0]) && !/workwave|work wave/i.test(r.keys[0]));
  const imp = pro.reduce((a,x)=>a+(x.impressions||0),0), clk = pro.reduce((a,x)=>a+(x.clicks||0),0);
  console.log(`INTENTION PRO STRICTE (artisan cherchant du travail), ${S} -> ${E}`);
  console.log(`  ${pro.length} requetes distinctes | ${imp} impressions | ${clk} clics`);
  console.log(`  soit ${(100*imp/324072).toFixed(3)}% des 324 072 impressions du site`);
  for (const r of pro.sort((a,b)=>(b.impressions||0)-(a.impressions||0)))
    console.log(`   pos ${(r.position||0).toFixed(1).padStart(5)} | ${String(r.impressions).padStart(4)} imp | ${String(r.clicks).padStart(2)} clics | ${r.keys[0]}`);
  // Requetes TETE : presence ou absence
  const tetes = ["trouver des chantiers","trouver des chantiers gratuitement","plateforme pour trouver des chantiers","site pour trouver des chantiers","trouver des chantiers artisan","chantiers a proximite","trouver des clients artisan","plateforme artisan","apport de chantiers","trouver des chantiers plombier","trouver des chantiers electricien","trouver des chantiers macon","trouver des chantiers peinture","trouver des chantiers renovation"];
  console.log(`\n=== Requetes TETE : presence dans GSC sur 3 mois ? ===`);
  for (const t of tetes) {
    const hit = all.find(r => r.keys[0].trim().toLowerCase() === t);
    console.log(`  ${hit ? `pos ${(hit.position||0).toFixed(1)} | ${hit.impressions} imp | ${hit.clicks} clics` : "ABSENTE (0 impression sur 3 mois)"} | "${t}"`);
  }
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
