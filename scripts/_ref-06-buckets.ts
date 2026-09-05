/** REFUTATION 6 (corrige le decoupage en deciles, fausse par les egalites a
 *  1 impression) : rendement par NOMBRE d'impressions. Une page qui vient
 *  juste de devenir visible atterrit dans le seau "1 impression". */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const fin = new Date(Date.now()-3*864e5).toISOString().slice(0,10);
  const debut = new Date(Date.now()-31*864e5).toISOString().slice(0,10);
  const rows: {u:string;c:number;i:number}[] = []; let start=0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: debut, endDate: fin, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const r = data.rows || []; if (!r.length) break;
    for (const x of r) rows.push({ u: x.keys![0].replace("https://workwave.fr",""), c: x.clicks||0, i: x.impressions||0 });
    start += r.length; if (r.length<25000) break;
  }
  const f = rows.filter(r=>r.u.startsWith("/artisan/"));
  const seaux: [string,(i:number)=>boolean][] = [
    ["1 impression",      i=>i===1],
    ["2 impressions",     i=>i===2],
    ["3 a 5",             i=>i>=3&&i<=5],
    ["6 a 10",            i=>i>=6&&i<=10],
    ["11 a 50",           i=>i>=11&&i<=50],
    ["51 et plus",        i=>i>=51],
  ];
  console.log("seau            pages   impressions   clics   CTR      clic/jour/page");
  for (const [lab,t] of seaux) {
    const s = f.filter(r=>t(r.i));
    const i = s.reduce((x,r)=>x+r.i,0), c = s.reduce((x,r)=>x+r.c,0);
    console.log(`${lab.padEnd(15)} ${String(s.length).padStart(6)} ${String(i).padStart(13)} ${String(c).padStart(7)} ${((c/Math.max(i,1))*100).toFixed(1).padStart(6)} %   ${(c/28/Math.max(s.length,1)).toFixed(5)}`);
  }
  const un = f.filter(r=>r.i===1);
  const cu = un.reduce((x,r)=>x+r.c,0);
  console.log(`\nUne page qui vient de franchir le seuil de visibilite = seau "1 impression".`);
  console.log(`rendement mesure de ce seau : ${(cu/28/un.length).toFixed(5)} clic/jour/page`);
  console.log(`24 400 pages marginales x ce rendement = ${(24400*cu/28/un.length).toFixed(0)} clics/jour`);
  console.log(`\n(l'audit applique la moyenne de TOUTES les visibles, ${(f.reduce((x,r)=>x+r.c,0)/28/f.length).toFixed(5)}, a des pages marginales.)`);
})();
