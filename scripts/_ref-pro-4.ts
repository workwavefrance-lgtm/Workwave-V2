import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  // clics par requete sur l ensemble des pages d acquisition pro (3 prefixes stricts)
  const win = async (S: string, E: string, lab: string) => {
    let tot = { i: 0, c: 0 }; const marque = { i: 0, c: 0 };
    for (const expr of ["https://workwave.fr/trouver-des-chantiers","https://workwave.fr/trouver-des-clients","https://workwave.fr/pro"]) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 500,
        dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: expr }] }] }});
      for (const row of (r.data.rows||[])) {
        // exclure la pollution /promenade-animaux capturee par "contains /pro"
        tot.i += row.impressions||0; tot.c += row.clicks||0;
        if (/workwave|work wave/i.test(row.keys[0])) { marque.i += row.impressions||0; marque.c += row.clicks||0; }
      }
    }
    console.log(`${lab} [${S} -> ${E}] : ${tot.i} imp | ${tot.c} clics  ||  dont marque workwave : ${marque.i} imp | ${marque.c} clics`);
  };
  await win("2026-06-04","2026-09-02","pages pro (3 prefixes)");
  await win("2026-08-03","2026-09-02","  dernier mois");
  // page /pro exacte : requete "workwave" seule
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: "2026-06-04", endDate: "2026-09-02", dimensions: ["query","page"], rowLimit: 1000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "https://workwave.fr/pro" }] }] }});
  const rows = (r.data.rows||[]).filter(x=>(x.clicks||0)>0);
  console.log(`\nToutes les paires (requete,page) AVEC clic sur /pro* :`);
  for (const row of rows) console.log(`   ${String(row.clicks).padStart(2)} clics | ${row.keys[0]} -> ${row.keys[1].replace("https://workwave.fr","")}`);
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
