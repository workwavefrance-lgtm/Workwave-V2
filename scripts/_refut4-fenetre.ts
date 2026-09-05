import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const fenetres: [string,string,string][] = [
    ["28 derniers jours (reels)","2026-08-07","2026-09-03"],
    ["juillet","2026-07-01","2026-07-31"],
    ["juin-juillet","2026-06-15","2026-07-15"],
    ["90 jours","2026-06-06","2026-09-03"],
  ];
  const villes = ["bordeaux","lyon","marseille","toulouse","nantes","montpellier"];
  for (const [lab,S,E] of fenetres) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["page"], rowLimit: 1000,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/plombier/" }] }] } });
    const rows = r.data.rows||[];
    let mi=0, mc=0, lignes: string[] = [];
    for (const v of villes) {
      const m = rows.find(x => (x.keys?.[0]||"").endsWith("/plombier/"+v));
      if (m) { mi += m.impressions||0; mc += m.clicks||0; lignes.push(`${v} pos ${(m.position||0).toFixed(1)} ${m.impressions}imp ${m.clicks}cl`); }
    }
    let ti=0,tc=0; for (const x of rows){ti+=x.impressions||0;tc+=x.clicks||0;}
    console.log(`\n=== ${lab} (${S}->${E}) ===`);
    console.log(`  6 metropoles : ${mi} imp, ${mc} clics | TOUTES pages /plombier/ : ${ti} imp, ${tc} clics`);
    console.log(`  ${lignes.join(" | ") || "(aucune metropole avec impressions)"}`);
  }
})().catch(e=>{console.error(e.response?.data?.error?.message ?? e.message);process.exit(1);});
