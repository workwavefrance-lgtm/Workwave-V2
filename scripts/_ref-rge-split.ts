import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-01", E = "2026-08-31";
// Le regex de l audit
const AUDIT = /\b(aide|prime|maprimerenov|subvention|cee|credit d)/i;
// Intention REELLE renovation energetique / subvention travaux
const RENO = /(maprimerenov|ma prime renov|prime renov|renovation energetique|cee\b|certificat.*economie|anah|eco.?pret|ptz|credit d.?impot|subvention.*travaux|prime.*(isolation|pompe|chaudiere|fenetre|travaux)|aide.*(isolation|pompe a chaleur|chaudiere|fenetre|renovation|travaux|energ))/i;
// Intention "aide a la personne" (service, pas subvention)
const PERSONNE = /aide.*(personne|domicile|senior|age|handicap|administrativ|menagere|soignant|articulaire|financiere|social)|aides? (handicap|personnes)/i;
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const all: any[] = [];
  for (let start = 0; start < 200000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
  }
  const hits = all.filter(r => AUDIT.test(r.keys![0]));
  const sum = (rs:any[]) => rs.reduce((a,r)=>({i:a.i+(r.impressions||0),c:a.c+(r.clicks||0)}),{i:0,c:0});
  const tot = sum(hits);
  console.log(`Regex de l audit "aide/prime" : ${hits.length} requetes, ${tot.i} imp, ${tot.c} clics`);
  const reno = hits.filter(r=>RENO.test(r.keys![0]));
  const pers = hits.filter(r=>PERSONNE.test(r.keys![0]) && !RENO.test(r.keys![0]));
  const autre = hits.filter(r=>!RENO.test(r.keys![0]) && !PERSONNE.test(r.keys![0]));
  const sr=sum(reno), sp=sum(pers), sa=sum(autre);
  console.log(`  -> RENOVATION/subvention travaux (le vrai sujet RGE) : ${reno.length} req, ${sr.i} imp, ${sr.c} clics`);
  console.log(`  -> AIDE A LA PERSONNE (service, faux positif)        : ${pers.length} req, ${sp.i} imp, ${sp.c} clics`);
  console.log(`  -> reste non classe                                  : ${autre.length} req, ${sa.i} imp, ${sa.c} clics`);
  console.log(`\nles requetes RENOVATION reellement mesurees :`);
  for (const r of reno.sort((a,b)=>(b.impressions||0)-(a.impressions||0))) console.log(`   ${String(r.impressions).padStart(4)} imp | ${r.clicks} clics | pos ${(r.position||0).toFixed(1)} | "${r.keys![0]}"`);
  console.log(`\nreste non classe (echantillon 20) :`);
  for (const r of autre.sort((a,b)=>(b.impressions||0)-(a.impressions||0)).slice(0,20)) console.log(`   ${String(r.impressions).padStart(4)} imp | pos ${(r.position||0).toFixed(1)} | "${r.keys![0]}"`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
