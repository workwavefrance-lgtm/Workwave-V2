import { google } from "googleapis";
import fs from "fs";
const DEPT = /^https:\/\/workwave\.fr\/[^/]+\/[a-z0-9-]+-(\d{2,3}|2a|2b)$/i;
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let all: any[] = [];
  for (let start = 0; start < 25000; start += 5000) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: "2026-08-07", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 5000, startRow: start } });
    const rows = r.data.rows || [];
    all = all.concat(rows);
    if (rows.length < 5000) break;
  }
  console.log(`pages avec impressions (28j) toutes routes : ${all.length}`);
  const depts = all.filter(r => DEPT.test(r.keys![0]));
  const impD = depts.reduce((s, r) => s + (r.impressions || 0), 0);
  const clkD = depts.reduce((s, r) => s + (r.clicks || 0), 0);
  const impT = all.reduce((s, r) => s + (r.impressions || 0), 0);
  const clkT = all.reduce((s, r) => s + (r.clicks || 0), 0);
  console.log(`pages /[metier]/[dept-NN] avec impressions : ${depts.length}`);
  console.log(`  leurs impressions : ${impD} (${(100*impD/impT).toFixed(1)}% du site) ; clics : ${clkD} (${(100*clkD/clkT).toFixed(1)}% du site)`);
  console.log(`  total site 28j : ${clkT} clics, ${impT} impressions`);
  depts.sort((a,b)=> (b.impressions||0)-(a.impressions||0));
  console.log("top 20 pages dept par impressions :");
  for (const r of depts.slice(0,20)) console.log(`   ${r.keys![0]}  imp=${r.impressions} clics=${r.clicks} pos=${(r.position||0).toFixed(1)}`);
  const clic0 = depts.filter(r=>(r.clicks||0)===0).length;
  console.log(`pages dept a 0 clic sur 28j : ${clic0} / ${depts.length}`);
  fs.writeFileSync("/tmp/dept-pages.json", JSON.stringify(depts.map(r=>({p:r.keys![0],i:r.impressions,c:r.clicks,pos:r.position})),null,0));
})();
