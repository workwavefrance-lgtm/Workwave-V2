import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
    startDate: "2026-08-07", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 25000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "workwave.fr/plombier/" }] }] } });
  const rows = (r.data.rows||[]).map(x=>({u:x.keys![0].replace("https://workwave.fr",""),c:x.clicks!,i:x.impressions!,p:x.position!}))
    .filter(x=>x.u.split("/").length===3 && !/-\d{2,3}$/.test(x.u)).sort((a,b)=>b.i-a.i);
  console.log(`toutes pages /plombier/<ville> : ${rows.length} pages, ${rows.reduce((a,b)=>a+b.c,0)} clics, ${rows.reduce((a,b)=>a+b.i,0)} imp`);
  console.log("les 15 plus vues :");
  rows.slice(0,15).forEach(x=>console.log(`  ${x.u.padEnd(38)} ${String(x.i).padStart(5)} imp | ${String(x.c).padStart(3)} clics | pos ${x.p.toFixed(1)}`));
  const GV = ["paris","marseille","lyon","toulouse","nice","nantes","montpellier","strasbourg","bordeaux","lille","rennes","reims","toulon","saint-etienne","grenoble","dijon","angers","nimes","villeurbanne","le-mans","clermont-ferrand","aix-en-provence","brest","tours","amiens","limoges","annecy","perpignan","metz","besancon"];
  const gv = rows.filter(x=>GV.includes(x.u.split("/")[2]));
  console.log(`\n30 plus grandes villes : ${gv.length} pages, ${gv.reduce((a,b)=>a+b.c,0)} clics, ${gv.reduce((a,b)=>a+b.i,0)} impressions sur 28j`);
})().catch(e=>{console.error(e.message);process.exit(1);});
