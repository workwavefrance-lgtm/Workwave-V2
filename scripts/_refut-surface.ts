import { google } from "googleapis";
const VILLES = ["paris","marseille","lyon","toulouse","nice","nantes","montpellier","strasbourg","bordeaux","lille","rennes","reims","toulon","saint-etienne","le-havre","grenoble","dijon","angers","nimes","villeurbanne"];
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let tc=0, ti=0, np=0; const details: string[] = [];
  for (const v of VILLES) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: "2026-08-07", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 25000,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: `workwave.fr/${""}` }, { dimension: "page", operator: "contains", expression: `/${v}` }] }] } });
    const rows = (r.data.rows||[]).map(x=>({u:x.keys![0].replace("https://workwave.fr",""),c:x.clicks!,i:x.impressions!}))
      .filter(x=>x.u.endsWith("/"+v) && x.u.split("/").length===3);
    const c=rows.reduce((a,b)=>a+b.c,0), i=rows.reduce((a,b)=>a+b.i,0);
    tc+=c; ti+=i; np+=rows.length;
    details.push(`  ${v.padEnd(16)} ${String(rows.length).padStart(4)} pages | ${String(c).padStart(3)} clics | ${String(i).padStart(6)} imp`);
  }
  console.log("SURFACE /[metier]/<20 plus grandes villes> sur 28j (07/08-03/09) :");
  details.forEach(d=>console.log(d));
  console.log(`  TOTAL ${np} pages | ${tc} clics | ${ti} impressions  => ${(ti/28).toFixed(0)} imp/jour, ${(tc/28).toFixed(2)} clic/jour`);
})().catch(e=>{console.error(e.message);process.exit(1);});
