import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  for (const [S,E,lab] of [["2026-08-01","2026-08-31","aout 2026"],["2026-06-01","2026-08-31","3 mois juin-aout"]] as [string,string,string][]) {
    const all: any[] = [];
    for (let start = 0; start < 200000; start += 25000) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000, startRow: start } });
      const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
    }
    let ti=0; for (const r of all) ti+=r.impressions||0;
    console.log(`\n=== ${lab} : ${all.length} requetes, ${ti} impressions ===`);
    const tests: [string,RegExp][] = [
      ["maprimerenov / ma prime renov", /maprimerenov|ma prime r[ée]nov|primerenov/i],
      ["RGE (mot exact)", /\brge\b/i],
      ["isolation", /isolation|isoler/i],
      ["pompe a chaleur / PAC", /pompe a chaleur|pompe à chaleur|\bpac\b/i],
      ["renovation energetique", /r[ée]novation [ée]nerg/i],
      ["CEE / certificat economie", /\bcee\b|certificat.*[ée]conomie/i],
      ["anah", /anah/i],
      ["qualibat / qualipac / qualisol", /qualibat|qualipac|qualisol|quali.?pv/i],
      ["credit impot / eco pret", /cr[ée]dit d.?imp[oô]t|[ée]co.?pr[eê]t|\bptz\b/i],
    ];
    for (const [n,re] of tests) {
      const h = all.filter(r=>re.test(r.keys![0]));
      let i=0,c=0,ps=0; for(const r of h){i+=r.impressions||0;c+=r.clicks||0;ps+=(r.position||0)*(r.impressions||0);}
      console.log(`  ${String(i).padStart(5)} imp | ${String(c).padStart(3)} clics | ${String(h.length).padStart(4)} req | pos ${i?(ps/i).toFixed(1):"-"} | ${n}`);
    }
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
