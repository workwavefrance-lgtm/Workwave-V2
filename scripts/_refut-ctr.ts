import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
(async()=>{
  const sb=getServiceClient();
  const {data:cats}=await sb.from("categories").select("slug").in("vertical",["btp","domicile","personne"]);
  const slugs=new Set((cats||[]).map((c:any)=>c.slug));
  const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
  const sc=google.searchconsole({version:"v1",auth:await auth.getClient() as any});
  const rows:any[]=[];let sr=0;
  while(true){const r=await sc.searchanalytics.query({siteUrl:"https://workwave.fr/",requestBody:{
    startDate:"2026-08-04",endDate:"2026-09-02",dimensions:["page"],rowLimit:25000,startRow:sr}});
    const d=r.data.rows||[];if(!d.length)break;rows.push(...d);sr+=d.length;if(d.length<25000)break;}
  // CTR reelle par tranche de position, sur les pages listing metier x lieu
  const buckets=[[1,5],[5,10],[10,15],[15,20],[20,25],[25,30],[30,40],[40,100]];
  const acc=buckets.map(()=>({i:0,c:0,n:0}));
  for(const r of rows){
    const seg=new URL(r.keys[0]).pathname.split("/").filter(Boolean);
    if(seg.length!==2||!slugs.has(seg[0]))continue;
    const bi=buckets.findIndex(([a,b])=>r.position>=a&&r.position<b);
    if(bi<0)continue; acc[bi].i+=r.impressions; acc[bi].c+=r.clicks; acc[bi].n++;
  }
  console.log("CTR REELLE des pages metier x lieu, par tranche de position (30 j) :");
  buckets.forEach(([a,b],k)=>{const t=acc[k]; if(!t.i)return;
    console.log(`  pos ${String(a).padStart(2)}-${String(b).padStart(3)} : ${String(t.n).padStart(6)} pages | ${String(t.i).padStart(7)} impr | ${String(t.c).padStart(5)} clics | CTR ${(100*t.c/t.i).toFixed(2)}%`);});
  console.log("\nHYPOTHESE DE L AUDIT : CTR 0,4 % a la position 26 -> 1,2 % a la position 15 (+0,8 pt)");
})().catch(e=>{console.error(e.message);process.exit(1);});
