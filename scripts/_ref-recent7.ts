import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const isL = (u: string) => { const p=u.replace("https://workwave.fr","").split("?")[0]; const s=p.split("/").filter(Boolean);
    return (s.length===2||s.length===3) && !["artisan","guide-des-prix","blog","ai","en","trouver-des-chantiers","trouver-des-clients"].includes(s[0]) && !s[0].startsWith("barometre"); };

  for (const [lab, S, E] of [["28j 05/08-01/09","2026-08-05","2026-09-01"], ["7j recents 26/08-01/09","2026-08-26","2026-09-01"]] as [string,string,string][]) {
    let pages: any[] = [], start = 0;
    while (true) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start } });
      const rows = r.data.rows || []; if (!rows.length) break; pages.push(...rows); start += rows.length; if (rows.length < 25000) break;
    }
    const nj = (new Date(E).getTime()-new Date(S).getTime())/86400000 + 1;
    const L = pages.filter(r => isL(r.keys[0]));
    const cib = L.filter(r => r.position >= 4 && r.position <= 20);
    const tc = pages.reduce((a,r)=>a+r.clicks,0);
    console.log(`\n=== ${lab} (${nj} jours) ===`);
    console.log(`  site           : ${tc} clics (${(tc/nj).toFixed(0)}/jour)`);
    console.log(`  LISTINGS total : ${L.reduce((a,r)=>a+r.clicks,0)} clics (${(L.reduce((a,r)=>a+r.clicks,0)/nj).toFixed(1)}/jour) | ${L.reduce((a,r)=>a+r.impressions,0)} imp | CTR ${(100*L.reduce((a,r)=>a+r.clicks,0)/L.reduce((a,r)=>a+r.impressions,0)).toFixed(2)}%`);
    console.log(`  dont pos 4-20  : ${cib.length} pages | ${cib.reduce((a,r)=>a+r.impressions,0)} imp | ${cib.reduce((a,r)=>a+r.clicks,0)} clics (${(cib.reduce((a,r)=>a+r.clicks,0)/nj).toFixed(1)}/jour) | CTR ${(100*cib.reduce((a,r)=>a+r.clicks,0)/cib.reduce((a,r)=>a+r.impressions,0)).toFixed(2)}%`);
    if (lab.startsWith("7j")) require("fs").writeFileSync("/private/tmp/gsc/REF_pages7.json", JSON.stringify(pages));
  }
}
main().catch(e => console.error("ERREUR", e.message));
