import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S="2026-08-01", E="2026-08-31";
  const fam = async (label:string, expr:string) => {
    let start=0, n=0, imp=0, clk=0;
    while (true) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate:S,endDate:E,dimensions:["page"],rowLimit:25000,startRow:start,
        dimensionFilterGroups:[{filters:[{dimension:"page",operator:"contains",expression:expr}]}] } });
      const rows=r.data.rows||[]; if(!rows.length) break;
      n+=rows.length; imp+=rows.reduce((a,b)=>a+(b.impressions||0),0); clk+=rows.reduce((a,b)=>a+(b.clicks||0),0);
      start+=rows.length; if (rows.length<25000) break;
    }
    console.log(`${label.padEnd(26)} : ${String(n).padStart(6)} pages avec >=1 impression | ${String(imp).padStart(7)} imp | ${String(clk).padStart(5)} clics`);
  };
  await fam("/artisan/", "/artisan/");
  await fam("total site", "workwave.fr");
}
main().catch(e=>{console.error(e.message);process.exit(1);});
