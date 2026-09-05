import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const pull = async (S: string, E: string, expr: string) => {
    const out: any[] = [];
    for (let start = 0; start < 30000; start += 5000) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
        startDate: S, endDate: E, dimensions: ["page"], rowLimit: 5000, startRow: start,
        dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "includingRegex", expression: expr }] }] } });
      const rows = r.data.rows || []; out.push(...rows);
      if (rows.length < 5000) break;
    }
    return out;
  };
  const RE3 = "^https://workwave\\.fr/[a-z0-9-]+/[a-z0-9-]+/[a-z0-9-]+$";
  for (const [S, E, lab] of [["2026-08-05","2026-09-01","28 jours"],["2026-06-06","2026-09-01","88 jours"]] as const) {
    const rows = await pull(S, E, RE3);
    const btp = rows.filter(r => !((r.keys||[])[0]||"").includes("/ai/"));
    const c = btp.reduce((a, r) => a + (r.clicks||0), 0);
    const i = btp.reduce((a, r) => a + (r.impressions||0), 0);
    const jours = lab === "28 jours" ? 28 : 88;
    console.log(`\n[${lab}] pages SPECIALITE BTP avec impressions : ${btp.length} | clics=${c} | imp=${i}`);
    console.log(`   clics/jour de toute la famille : ${(c/jours).toFixed(3)}`);
    console.log(`   rendement par page qui a des impressions : ${(c/Math.max(btp.length,1)/jours).toFixed(4)} clic/page/jour`);
    console.log(`   rendement rapporte aux 3990 URL du sitemap : ${(c/3990/jours).toFixed(5)} clic/page/jour`);
    for (const r of btp.slice(0,10)) console.log(`      ${(r.keys||[])[0].replace("https://workwave.fr","")} ${r.clicks}c/${r.impressions}i pos${Math.round(r.position||0)}`);
  }
  // Base de comparaison honnete : metier/VILLE, deux denominateurs
  const villes = await pull("2026-08-05", "2026-09-01", "^https://workwave\\.fr/[a-z0-9-]+/[a-z0-9-]+$");
  const v = villes.filter(r => !/-[0-9]{2,3}$/.test((r.keys||[])[0]||""));
  const vc = v.reduce((a, r) => a + (r.clicks||0), 0);
  console.log(`\n[28 jours] metier/VILLE : ${v.length} pages avec impressions | clics=${vc}`);
  console.log(`   denominateur "pages avec impressions" : ${(vc/v.length/28).toFixed(4)} clic/page/jour  <-- chiffre utilise par l audit`);
  console.log(`   denominateur "URL du sitemap 2 (8235)" : ${(vc/8235/28).toFixed(4)} clic/page/jour  <-- denominateur comparable`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
