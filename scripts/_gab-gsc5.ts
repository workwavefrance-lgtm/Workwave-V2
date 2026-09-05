import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  // CTR par tranche de position, gabarit listing vs fiche
  for (const [label, expr] of [["fiches /artisan/","/artisan/"],["listings /[metier]/[ville]","NONE"]] as const) {
    const body: any = { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000 };
    if (expr !== "NONE") body.dimensionFilterGroups = [{ filters: [{ dimension: "page", operator: "contains", expression: expr }] }];
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: body });
    const rows = (r.data.rows||[]).filter(x => expr!=="NONE" ? true : !/\/artisan\/|\/guide-des-prix\/|\/blog\/|\/ai\/|\/en\//.test(x.keys![0]));
    const b = { "1-3":[0,0], "4-10":[0,0], "11-20":[0,0], "21+":[0,0] } as Record<string, number[]>;
    for (const x of rows) { const p=x.position||0; const k = p<=3?"1-3":p<=10?"4-10":p<=20?"11-20":"21+"; b[k][0]+= x.impressions||0; b[k][1]+= x.clicks||0; }
    console.log(`\n${label} (${rows.length} pages)`);
    for (const [k,[i,c]] of Object.entries(b)) console.log(`  pos ${k.padEnd(6)} : ${String(i).padStart(7)} impr | ${String(c).padStart(5)} clics | CTR ${(100*c/Math.max(i,1)).toFixed(2)}%`);
  }
}
main().catch(e=>console.error(e.message));
