import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb=getServiceClient();
  const { data:cats } = await sb.from("categories").select("slug,vertical").in("vertical",["btp","domicile","personne"]);
  const slugs=new Set((cats||[]).map((c:any)=>c.slug));
  const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
  const sc=google.searchconsole({version:"v1",auth:await auth.getClient() as any});
  const rows:any[]=[]; let sr=0;
  while(true){const r=await sc.searchanalytics.query({siteUrl:"https://workwave.fr/",requestBody:{
    startDate:"2026-08-04",endDate:"2026-09-02",dimensions:["page"],rowLimit:25000,startRow:sr}});
    const d=r.data.rows||[]; if(!d.length)break; rows.push(...d); sr+=d.length; if(d.length<25000)break;}
  let dept={n:0,i:0,c:0,p:0}, ville={n:0,i:0,c:0,p:0};
  for(const r of rows){
    const u=new URL(r.keys[0]); const seg=u.pathname.split("/").filter(Boolean);
    if(seg.length!==2) continue;
    if(!slugs.has(seg[0])) continue;                 // 1er segment = vrai metier BTP
    const isD=/-\d{2,3}$/.test(seg[1]);
    const t=isD?dept:ville; t.n++; t.i+=r.impressions; t.c+=r.clicks; t.p+=r.position*r.impressions;
  }
  const show=(l:string,t:any)=>console.log(`${l.padEnd(15)} ${String(t.n).padStart(6)} pages | ${String(t.i).padStart(7)} impr | ${String(t.c).padStart(5)} clics | pos ${(t.i?t.p/t.i:0).toFixed(1)} | CTR ${(100*t.c/Math.max(t.i,1)).toFixed(2)}%`);
  console.log("30 j (04/08 -> 02/09), 1er segment = categorie BTP/domicile/personne reelle :");
  show("metier x DEPT",dept); show("metier x VILLE",ville);
  console.log(`\nclics/jour actuels : dept ${(dept.c/30).toFixed(2)} | ville ${(ville.c/30).toFixed(1)}`);
  console.log(`AUDIT : dept 13091 impr / 209 clics / pos 26,2 ; ville 22111 pages`);
})().catch(e=>{console.error(e.message);process.exit(1);});
