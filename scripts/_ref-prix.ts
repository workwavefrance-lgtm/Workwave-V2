import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
const sc = google.searchconsole({ version: "v1", auth });
const q = async (b:any) => ((await sc.searchanalytics.query({ siteUrl: SITE, requestBody: b })).data.rows || []);
const RX = /\b(prix|tarif|co[uû]t|devis|combien)\b/i;

(async () => {
  // 1. Intention prix cote REQUETE, aout
  const rows = await q({ startDate:"2026-08-01", endDate:"2026-08-31", dimensions:["query"], rowLimit:25000 });
  const px = rows.filter(r=>RX.test(r.keys![0]));
  const imp = px.reduce((a,b)=>a+(b.impressions||0),0);
  const cl  = px.reduce((a,b)=>a+(b.clicks||0),0);
  const pos = imp ? px.reduce((a,b)=>a+(b.position||0)*(b.impressions||0),0)/imp : 0;
  console.log(`REQUETES PRIX aout : ${px.length} requetes | ${imp} imp | ${cl} clics | pos ponderee ${pos.toFixed(1)}`);
  console.log(`TOTAL requetes renvoyees par GSC : ${rows.length} | imp ${rows.reduce((a,b)=>a+(b.impressions||0),0)}`);
  const avecClic = px.filter(r=>(r.clicks||0)>0);
  console.log(`Requetes prix AVEC au moins 1 clic : ${avecClic.length} (total ${avecClic.reduce((a,b)=>a+(b.clicks||0),0)} clics)`);
  for (const r of avecClic.slice(0,10)) console.log(`   ${r.clicks} clics | pos ${(r.position||0).toFixed(0)} | ${r.keys![0]}`);

  // 2. CROISEMENT : sur ces requetes prix, quelles PAGES ressortent ? (page+query)
  console.log("\n=== Croisement page x requete sur intention prix (aout) ===");
  const pq = await q({ startDate:"2026-08-01", endDate:"2026-08-31", dimensions:["page","query"], rowLimit:25000 });
  const pqPrix = pq.filter(r=>RX.test(r.keys![1]));
  const parType: Record<string,{imp:number;cl:number}> = {};
  for (const r of pqPrix) {
    const u = r.keys![0];
    let t = "autre";
    if (u.includes("/guide-des-prix/")) t = "guide-des-prix";
    else if (u.includes("/artisan/")) t = "fiche artisan";
    else if (u.includes("/blog/")) t = "blog";
    else if (u.includes("/barometre")) t = "barometre";
    else if (u.replace("https://workwave.fr/","").split("/").length >= 2) t = "listing metier x lieu";
    parType[t] = parType[t] || {imp:0,cl:0};
    parType[t].imp += r.impressions||0; parType[t].cl += r.clicks||0;
  }
  const totPq = pqPrix.reduce((a,b)=>a+(b.impressions||0),0);
  console.log(`Lignes page x requete-prix : ${pqPrix.length} | imp ${totPq} | clics ${pqPrix.reduce((a,b)=>a+(b.clicks||0),0)}`);
  for (const [k,v] of Object.entries(parType).sort((a,b)=>b[1].imp-a[1].imp))
    console.log(`   ${k.padEnd(24)} ${String(v.imp).padStart(6)} imp | ${v.cl} clics`);
})().catch(e=>{console.error("ERR",e.message);process.exit(1);});
