import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function q(sc:any, S:string,E:string, filt?:string) {
  const body:any = { startDate:S, endDate:E, dimensions:["page"], rowLimit:25000 };
  if (filt) body.dimensionFilterGroups=[{filters:[{dimension:"page",operator:"contains",expression:filt}]}];
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: body });
  const rows=r.data.rows||[];
  return { pages: rows.length, imp: rows.reduce((a:any,b:any)=>a+(b.impressions||0),0), clics: rows.reduce((a:any,b:any)=>a+(b.clicks||0),0) };
}
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version:"v1", auth });
  const wins: [string,string][] = [["2026-06-04","2026-07-03"],["2026-07-04","2026-08-03"],["2026-08-04","2026-09-03"]];
  console.log("fenetre                  | SITE imp/clics        | pro chantiers   | pro clients");
  for (const [S,E] of wins) {
    const site = await q(sc,S,E);
    const ch = await q(sc,S,E,"/trouver-des-chantiers");
    const cl = await q(sc,S,E,"/trouver-des-clients");
    console.log(`${S}->${E} | ${String(site.imp).padStart(6)} imp ${String(site.clics).padStart(5)} clics | ${String(ch.imp).padStart(4)} imp ${ch.clics} clics | ${String(cl.imp).padStart(4)} imp ${cl.clics} clics`);
  }
  const tch = await q(sc,"2026-06-04","2026-09-04","/trouver-des-chantiers");
  const tcl = await q(sc,"2026-06-04","2026-09-04","/trouver-des-clients");
  console.log(`\nTOTAL 3 mois section pro : ${tch.imp+tcl.imp} impressions, ${tch.clics+tcl.clics} clic(s) sur 93 jours`);
  console.log(`=> ${((tch.clics+tcl.clics)/93).toFixed(3)} clic/jour mesure`);
})();
