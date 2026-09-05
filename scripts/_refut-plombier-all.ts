import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
    startDate: "2026-08-07", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 25000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "workwave.fr/plombier/" }] }] } });
  const rows = (r.data.rows || []).map(x => ({ url: x.keys![0].replace("https://workwave.fr",""), c: x.clicks!, i: x.impressions!, p: x.position! }))
    .filter(x => !/-\d{2,3}$/.test(x.url) && x.url.split("/").length === 3);
  console.log(`pages /plombier/<ville> avec au moins 1 impression sur 28j : ${rows.length}`);
  console.log(`  total : ${rows.reduce((a,b)=>a+b.c,0)} clics / ${rows.reduce((a,b)=>a+b.i,0)} impressions`);
  const sb = getServiceClient();
  const { data: cat } = await sb.from("categories").select("id").eq("slug","plombier").limit(1);
  const out: {url:string;i:number;c:number;p:number;ouv:number}[] = [];
  for (const row of rows) {
    const ville = row.url.split("/")[2];
    const { data: c } = await sb.from("cities").select("id").eq("slug", ville).limit(30);
    if (!c?.length) continue;
    const { count: ouv } = await sb.from("pros").select("id",{count:"exact",head:true})
      .in("city_id", c.map(x=>x.id)).eq("category_id", cat![0].id).eq("is_active",true).is("deleted_at",null)
      .or("etat_admin.is.null,etat_admin.neq.F");
    out.push({ ...row, ouv: ouv||0 });
  }
  const rank = (v:number[])=>{const s=v.map((x,i)=>[x,i]).sort((a,b)=>a[0]-b[0]);const q=new Array(v.length);s.forEach(([,i],k)=>q[i as number]=k+1);return q as number[];};
  const pearson=(a:number[],b:number[])=>{const n=a.length,ma=a.reduce((x,y)=>x+y,0)/n,mb=b.reduce((x,y)=>x+y,0)/n;let nu=0,da=0,db=0;for(let i=0;i<n;i++){const x=a[i]-ma,y=b[i]-mb;nu+=x*y;da+=x*x;db+=y*y;}return nu/Math.sqrt(da*db);};
  console.log(`\nN=${out.length} pages /plombier/ville avec densite connue`);
  console.log(`Spearman(pros OUVERTS, position) = ${pearson(rank(out.map(o=>o.ouv)),rank(out.map(o=>o.p))).toFixed(3)}`);
  const tr=[[1,5],[5,15],[15,40],[40,10000]];
  console.log("tranche ouverts | pages | position moy ponderee | clics | imp");
  for (const [lo,hi] of tr) { const g=out.filter(o=>o.ouv>=lo&&o.ouv<hi); if(!g.length)continue;
    const pm=g.reduce((a,b)=>a+b.p*b.i,0)/g.reduce((a,b)=>a+b.i,0);
    console.log(`  ${lo}-${hi===10000?"+":hi}`.padEnd(17)+`| ${String(g.length).padStart(5)} | ${pm.toFixed(1).padStart(21)} | ${String(g.reduce((a,b)=>a+b.c,0)).padStart(5)} | ${g.reduce((a,b)=>a+b.i,0)}`); }
})().catch(e => { console.error(e.message); process.exit(1); });
