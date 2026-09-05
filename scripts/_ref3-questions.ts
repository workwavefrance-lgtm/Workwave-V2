import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-05", E = "2026-09-01";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const agg = async (label: string, expr: string) => {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000,
      dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "contains", expression: expr }] }] } });
    const rows = r.data.rows || [];
    const c = rows.reduce((a, x) => a + (x.clicks || 0), 0);
    const i = rows.reduce((a, x) => a + (x.impressions || 0), 0);
    console.log(`${label.padEnd(22)} requetes=${String(rows.length).padStart(5)}  clics=${String(c).padStart(5)}  imp=${String(i).padStart(7)}  clics/j=${(c/28).toFixed(2)}`);
    return { c, i, n: rows.length };
  };
  console.log(`Requetes a forme "question" — fenetre ${S} -> ${E}`);
  let tc = 0, ti = 0, tn = 0;
  for (const [l, e] of [["comment", "comment "], ["quel/quelle", "quel"], ["pourquoi", "pourquoi"], ["faut-il", "faut-il"], ["est-ce que", "est-ce que"], ["combien", "combien"]] as [string,string][]) {
    const r = await agg(l, e); tc += r.c; ti += r.i; tn += r.n;
  }
  console.log(`TOTAL forme question   requetes=${tn}  clics=${tc}  imp=${ti}  clics/j=${(tc/28).toFixed(2)}`);
  // "je renove" / "je demenage" : intention moment de vie
  for (const [l, e] of [["je renove", "renov"], ["demenage", "demenage"], ["demenagement", "demenagement"]] as [string,string][]) await agg(l, e);
}
main().catch(e => { console.error("ERR", e.message); process.exit(1); });
