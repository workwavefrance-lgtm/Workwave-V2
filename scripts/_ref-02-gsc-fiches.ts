/** REFUTATION 2 : la base de chiffrage du gain. 0,0047 clic/jour/page visible
 *  est-il une MOYENNE representative, ou une moyenne ecrasee par une tete ? */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const fin = new Date(Date.now() - 3*864e5).toISOString().slice(0,10);
  const debut = new Date(Date.now() - 31*864e5).toISOString().slice(0,10);
  console.log(`fenetre ${debut} -> ${fin}`);
  const rows: {u:string;c:number;i:number;p:number}[] = []; let start=0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: debut, endDate: fin, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const r = data.rows || []; if (!r.length) break;
    for (const x of r) rows.push({ u: x.keys![0].replace("https://workwave.fr",""), c: x.clicks||0, i: x.impressions||0, p: x.position||0 });
    start += r.length; if (r.length < 25000) break;
  }
  const f = rows.filter(r => r.u.startsWith("/artisan/"));
  const clics = f.reduce((s,r)=>s+r.c,0), imps = f.reduce((s,r)=>s+r.i,0);
  const pos = f.reduce((s,r)=>s+r.p*r.i,0)/Math.max(imps,1);
  console.log(`\nfiches /artisan/ vues au moins une fois : ${f.length}`);
  console.log(`impressions ${imps} · clics ${clics} · position moyenne ponderee par impressions ${pos.toFixed(2)}`);
  console.log(`moyenne annoncee par l'audit : ${(clics/28/f.length).toFixed(4)} clic/jour/page visible`);
  const avecClic = f.filter(r=>r.c>0);
  console.log(`\nfiches ayant obtenu AU MOINS UN clic en 28 jours : ${avecClic.length} (${((avecClic.length/f.length)*100).toFixed(2)} % des visibles, ${((avecClic.length/2439976)*100).toFixed(3)} % du parc)`);
  console.log(`fiches a ZERO clic : ${f.length-avecClic.length} (${(((f.length-avecClic.length)/f.length)*100).toFixed(1)} %)`);
  const tri = [...f].sort((a,b)=>b.c-a.c);
  for (const n of [10,100,500,1000,5000]) {
    const s = tri.slice(0,n).reduce((x,r)=>x+r.c,0);
    console.log(`  top ${String(n).padStart(5)} fiches = ${String(s).padStart(6)} clics (${((s/clics)*100).toFixed(1)} % du total)`);
  }
  // distribution des impressions : la moyenne cache-t-elle une tete ?
  const triI = [...f].sort((a,b)=>b.i-a.i);
  for (const n of [100,1000,10000]) {
    const s = triI.slice(0,n).reduce((x,r)=>x+r.i,0);
    console.log(`  top ${String(n).padStart(5)} fiches = ${String(s).padStart(7)} impressions (${((s/imps)*100).toFixed(1)} % du total)`);
  }
  const med = tri[Math.floor(f.length/2)];
  console.log(`\nfiche visible MEDIANE : ${med.c} clic, ${med.i} impression(s) sur 28 jours -> ${(med.c/28).toFixed(4)} clic/jour`);
})();
