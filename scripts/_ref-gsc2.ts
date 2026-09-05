import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-06", E = "2026-09-02";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const all:any[]=[]; let start=0;
  while(true){
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody:{ startDate:S, endDate:E, dimensions:["page"], rowLimit:25000, startRow:start }});
    const rows=r.data.rows||[]; all.push(...rows);
    if(rows.length<25000) break; start+=rows.length;
    if(start>400000) break;
  }
  console.log(`TOTAL pages avec >=1 impression (28j ${S}->${E}) : ${all.length}`);
  const reDept = /^https:\/\/workwave\.fr\/[^/]+\/[a-z0-9-]+-\d{2,3}$/;
  const dept = all.filter(r=>reDept.test(String(r.keys?.[0])));
  const impD=dept.reduce((a,r)=>a+(r.impressions||0),0), clkD=dept.reduce((a,r)=>a+(r.clicks||0),0);
  const totImp=all.reduce((a,r)=>a+(r.impressions||0),0), totClk=all.reduce((a,r)=>a+(r.clicks||0),0);
  console.log(`\nPAGES DEPARTEMENT /[metier]/[dept-NN] :`);
  console.log(`  ${dept.length} pages avec impressions | ${impD} imp | ${clkD} clics | ${(clkD/28).toFixed(2)} clics/jour`);
  console.log(`SITE ENTIER : ${all.length} pages | ${totImp} imp | ${totClk} clics | ${(totClk/28).toFixed(1)} clics/jour`);
  console.log(`  part dept : ${(100*impD/totImp).toFixed(2)}% imp | ${(100*clkD/totClk).toFixed(2)}% clics`);
  // repartition des clics des pages dept
  const parClics:Record<string,number>={};
  for(const r of dept){const c=r.clicks||0;const k=c===0?"0":c===1?"1":c<=3?"2-3":"4+";parClics[k]=(parClics[k]??0)+1;}
  console.log(`  repartition clics des pages dept :`, parClics);
}
main().catch(e=>console.error(e.message));
