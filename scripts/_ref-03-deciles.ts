/** REFUTATION 3 : les pages qui deviendraient visibles seraient les
 *  MARGINALES, pas des pages moyennes. Rendement par decile de visibilite. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const fin = new Date(Date.now() - 3*864e5).toISOString().slice(0,10);
  const debut = new Date(Date.now() - 31*864e5).toISOString().slice(0,10);
  const rows: {u:string;c:number;i:number}[] = []; let start=0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: debut, endDate: fin, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const r = data.rows || []; if (!r.length) break;
    for (const x of r) rows.push({ u: x.keys![0].replace("https://workwave.fr",""), c: x.clicks||0, i: x.impressions||0 });
    start += r.length; if (r.length < 25000) break;
  }
  const f = rows.filter(r=>r.u.startsWith("/artisan/")).sort((a,b)=>b.i-a.i);
  const n = f.length, pas = Math.floor(n/10);
  console.log("decile de visibilite (1 = les plus vues)   pages   impressions   clics   clic/jour/page");
  for (let d=0; d<10; d++) {
    const seg = f.slice(d*pas, d===9 ? n : (d+1)*pas);
    const i = seg.reduce((s,r)=>s+r.i,0), c = seg.reduce((s,r)=>s+r.c,0);
    console.log(`  decile ${d+1}${" ".repeat(34)}`.slice(0,42) + `${String(seg.length).padStart(6)} ${String(i).padStart(13)} ${String(c).padStart(7)}   ${(c/28/seg.length).toFixed(5)}`);
  }
  const bas = f.slice(Math.floor(n/2));
  const cb = bas.reduce((s,r)=>s+r.c,0);
  console.log(`\nmoitie BASSE des fiches deja visibles : ${bas.length} pages, ${cb} clics en 28 j -> ${(cb/28/bas.length).toFixed(5)} clic/jour/page`);
  console.log(`c'est le rendement a appliquer a des pages qui viendraient JUSTE de franchir le seuil de visibilite.`);
  console.log(`24 400 pages marginales x ce rendement = ${(24400*cb/28/bas.length).toFixed(1)} clics/jour (l'audit annonce 100).`);
})();
