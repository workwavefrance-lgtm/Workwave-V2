import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const { data } = await sc.searchanalytics.query({
    siteUrl: site,
    requestBody: { startDate: "2026-08-05", endDate: "2026-09-02", dimensions: ["page"], rowLimit: 25000 },
  });
  const rows = data.rows || [];
  // page departement = /metier/nom-NN (2 segments, 2e finit par -NN)
  const dept = /^https:\/\/workwave\.fr\/[^/]+\/[a-z0-9-]+-\d{2,3}$/;
  let dImp = 0, dClk = 0, dN = 0;
  let tImp = 0, tClk = 0;
  for (const r of rows) {
    const u = (r.keys || [])[0] || "";
    tImp += r.impressions || 0; tClk += r.clicks || 0;
    if (dept.test(u)) { dImp += r.impressions || 0; dClk += r.clicks || 0; dN++; }
  }
  console.log(`Fenetre 05/08 -> 02/09, ${rows.length} pages avec au moins 1 impression`);
  console.log(`TOTAL site           : ${tImp} impressions, ${tClk} clics`);
  console.log(`Pages departement    : ${dN} pages, ${dImp} impressions, ${dClk} clics  (${(100*dImp/tImp).toFixed(1)} % des impressions)`);
  const g = rows.filter(r => (r.keys||[])[0]?.includes("/demenagement/gironde-33"));
  console.log(`/demenagement/gironde-33 : ${g.length ? JSON.stringify(g[0]) : "ZERO impression sur 28 jours"}`);
})();
