import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });

async function q(body: any) {
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: body });
  return r.data.rows || [];
}
function agg(rows: any[], label: string) {
  const imp = rows.reduce((a,b)=>a+(b.impressions||0),0);
  const cl  = rows.reduce((a,b)=>a+(b.clicks||0),0);
  const pos = imp ? rows.reduce((a,b)=>a+(b.position||0)*(b.impressions||0),0)/imp : 0;
  console.log(`${label.padEnd(46)} pages=${String(rows.length).padStart(5)} imp=${String(imp).padStart(7)} clics=${String(cl).padStart(5)} posPonderee=${pos.toFixed(1)}`);
  return { imp, cl, pos, n: rows.length };
}

(async () => {
  console.log("=== A. /guide-des-prix/ par mois (dimension page) ===");
  for (const [S,E,lab] of [["2026-08-01","2026-08-31","aout"],["2026-07-01","2026-07-31","juillet"],["2026-06-01","2026-06-30","juin"]] as any) {
    const rows = await q({ startDate:S, endDate:E, dimensions:["page"], rowLimit:25000,
      dimensionFilterGroups:[{filters:[{dimension:"page",operator:"contains",expression:"/guide-des-prix/"}]}] });
    agg(rows, `  ${lab}`);
  }

  console.log("\n=== B. Comparaison des familles de pages (aout) ===");
  for (const pref of ["/guide-des-prix/","/artisan/","/blog/","/trouver-des-chantiers","/barometre"]) {
    const rows = await q({ startDate:"2026-08-01", endDate:"2026-08-31", dimensions:["page"], rowLimit:25000,
      dimensionFilterGroups:[{filters:[{dimension:"page",operator:"contains",expression:pref}]}] });
    agg(rows, `  ${pref}`);
  }

  console.log("\n=== C. TOTAL SITE aout (pour mettre en perspective) ===");
  const tot = await q({ startDate:"2026-08-01", endDate:"2026-08-31", dimensions:["date"], rowLimit:100 });
  agg(tot, "  site entier");
})().catch(e=>{console.error("ERR", e.message); process.exit(1);});
