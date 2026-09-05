import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
    startDate: "2026-08-07", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 25000 } });
  const rows = (r.data.rows || []).map(x => ({ url: x.keys![0], c: x.clicks!, i: x.impressions!, p: x.position! }));
  // pages /metier/ville (2 segments, pas un dept -NN)
  const listing = rows.filter(x => /^https:\/\/workwave\.fr\/[a-z0-9-]+\/[a-z0-9-]+$/.test(x.url) && !/-\d{2,3}$/.test(x.url))
    .sort((a,b)=>b.i-a.i).slice(0,300);
  const sb = getServiceClient();
  const out: { url:string; i:number; c:number; p:number; ouv:number }[] = [];
  for (const row of listing) {
    const [, metier, ville] = row.url.replace("https://workwave.fr/","").split("/").reduce((a,v,i)=>{a[i+1]=v;return a;},[] as string[]) as unknown as string[];
    const { data: cat } = await sb.from("categories").select("id").eq("slug", metier).limit(1);
    const { data: c } = await sb.from("cities").select("id").eq("slug", ville).limit(30);
    if (!cat?.length || !c?.length) continue;
    const { count: ouv } = await sb.from("pros").select("id",{count:"exact",head:true})
      .in("city_id", c.map(x=>x.id)).eq("category_id", cat[0].id).eq("is_active",true).is("deleted_at",null)
      .or("etat_admin.is.null,etat_admin.neq.F");
    out.push({ url: row.url.replace("https://workwave.fr",""), i: row.i, c: row.c, p: row.p, ouv: ouv||0 });
  }
  const rank = (v: number[]) => { const s = v.map((x,i)=>[x,i]).sort((a,b)=>a[0]-b[0]); const r = new Array(v.length); s.forEach(([,i],k)=>r[i as number]=k+1); return r as number[]; };
  const pearson = (a:number[],b:number[]) => { const n=a.length,ma=a.reduce((x,y)=>x+y,0)/n,mb=b.reduce((x,y)=>x+y,0)/n;
    let num=0,da=0,db=0; for(let i=0;i<n;i++){const x=a[i]-ma,y=b[i]-mb;num+=x*y;da+=x*x;db+=y*y;} return num/Math.sqrt(da*db); };
  const ouv = out.map(o=>o.ouv), pos = out.map(o=>o.p);
  console.log(`N pages mesurees : ${out.length}`);
  console.log(`Spearman(nb pros OUVERTS, position moyenne) = ${pearson(rank(ouv),rank(pos)).toFixed(3)}   (0 = aucun lien ; negatif = plus de pros -> meilleure position)`);
  console.log(`Spearman(nb pros OUVERTS, clics)            = ${pearson(rank(ouv),rank(out.map(o=>o.c))).toFixed(3)}`);
  // tranches
  const tr = [[0,10],[10,30],[30,100],[100,10000]];
  console.log("\ntranche de pros ouverts | n pages | position moy | clics | impressions");
  for (const [lo,hi] of tr) {
    const g = out.filter(o=>o.ouv>=lo && o.ouv<hi);
    if (!g.length) continue;
    const pm = g.reduce((a,b)=>a+b.p*b.i,0)/g.reduce((a,b)=>a+b.i,0);
    console.log(`  ${String(lo).padStart(3)} a ${String(hi===10000?"+":hi).padEnd(5)}        | ${String(g.length).padStart(7)} | ${pm.toFixed(1).padStart(12)} | ${String(g.reduce((a,b)=>a+b.c,0)).padStart(5)} | ${g.reduce((a,b)=>a+b.i,0)}`);
  }
  // les 12 pages les plus vues
  console.log("\nles 12 pages listing les plus vues :");
  for (const o of out.slice(0,12)) console.log(`  ${o.url.padEnd(34)} ouverts ${String(o.ouv).padStart(4)} | ${String(o.i).padStart(5)} imp | ${String(o.c).padStart(3)} clics | pos ${o.p.toFixed(1)}`);
})().catch(e => { console.error(e.message); process.exit(1); });
