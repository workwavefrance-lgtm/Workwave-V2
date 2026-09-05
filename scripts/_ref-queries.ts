import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let all: any[] = [];
  for (let start = 0; start < 100000; start += 5000) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: "2026-08-07", endDate: "2026-09-03", dimensions: ["query"], rowLimit: 5000, startRow: start } });
    const rows = r.data.rows || []; all = all.concat(rows); if (rows.length < 5000) break;
  }
  const sum = (a: any[], k: string) => a.reduce((s, r) => s + (r[k] || 0), 0);
  const re = /meilleur|top ?10|classement|mieux not|avis|note/i;
  const hit = all.filter(r => re.test(r.keys![0]));
  console.log(`requetes (28j) : ${all.length} ; ${sum(all,"clicks")} clics ; ${sum(all,"impressions")} imp`);
  console.log(`requetes contenant meilleur/top10/classement/avis/note : ${hit.length} ; ${sum(hit,"clicks")} clics (${(100*sum(hit,"clicks")/sum(all,"clicks")).toFixed(2)}%) ; ${sum(hit,"impressions")} imp (${(100*sum(hit,"impressions")/sum(all,"impressions")).toFixed(2)}%)`);
  hit.sort((a,b)=>(b.clicks||0)-(a.clicks||0));
  for (const r of hit.slice(0,12)) console.log(`   "${r.keys![0]}" clics=${r.clicks} imp=${r.impressions} pos=${(r.position||0).toFixed(1)}`);
})();
