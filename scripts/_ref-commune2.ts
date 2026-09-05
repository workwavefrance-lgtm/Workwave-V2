import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  const auth = new google.auth.GoogleAuth({ scopes:["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version:"v1", auth });
  let all:any[]=[];
  for (let s=0;s<200000;s+=25000){
    const r = await sc.searchanalytics.query({ siteUrl:"https://workwave.fr/", requestBody:{ startDate:"2026-08-05", endDate:"2026-09-01", dimensions:["page"], rowLimit:25000, startRow:s }});
    const rows=r.data.rows||[]; all.push(...rows); if(rows.length<25000) break;
  }
  const art = all.filter(r=>r.keys![0].includes("/artisan/"));
  const slugs = art.map(r=>decodeURIComponent(r.keys![0].split("/artisan/")[1]||"").replace(/\/$/,"").split("?")[0]).filter(Boolean);
  const bySlug=new Map<string,any>();
  for(let i=0;i<slugs.length;i+=300){
    const {data}=await sb.from("pros").select("slug,city_id").in("slug",slugs.slice(i,i+300));
    for(const r of (data??[])) bySlug.set(r.slug,r);
  }
  const cityClics=new Map<number,number>();
  let nC=0;
  for(const r of art){
    const s=decodeURIComponent(r.keys![0].split("/artisan/")[1]||"").replace(/\/$/,"").split("?")[0];
    const p=bySlug.get(s); if(!p?.city_id) continue;
    const c=r.clicks||0; nC+=c;
    cityClics.set(p.city_id,(cityClics.get(p.city_id)||0)+c);
  }
  const ids=[...cityClics.keys()];
  const insee=new Map<number,string>();
  for(let i=0;i<ids.length;i+=500){
    const {data}=await sb.from("cities").select("id,insee_code").in("id",ids.slice(i,i+500));
    for(const c of (data??[])) if(c.insee_code) insee.set(c.id,c.insee_code);
  }
  const codes=[...new Set(insee.values())];
  const ok=new Map<string,any>();
  for(let i=0;i<codes.length;i+=500){
    const {data,error}=await sb.from("commune_data").select("insee_code,prix_m2_moyen,revenu_median,taux_vacance").in("insee_code",codes.slice(i,i+500));
    if(error){console.log("ERR",error.message);break;}
    for(const d of (data??[])) ok.set(d.insee_code,d);
  }
  let cPrix=0,cRev=0,cRien=0;
  for(const [cid,c] of cityClics){
    const ic=insee.get(cid); const d=ic?ok.get(ic):null;
    if(d?.prix_m2_moyen!=null) cPrix+=c;
    if(d?.revenu_median!=null) cRev+=c;
    if(!d || (d.prix_m2_moyen==null && d.revenu_median==null)) cRien+=c;
  }
  const pc=(a:number)=>`${a}/${nC} = ${(100*a/Math.max(nC,1)).toFixed(2)}%`;
  console.log(`clics avec ville connue : ${nC}`);
  console.log(`  commune_data avec prix_m2_moyen   : ${pc(cPrix)}`);
  console.log(`  commune_data avec revenu_median   : ${pc(cRev)}`);
  console.log(`  AUCUNE donnee commune exploitable : ${pc(cRien)}`);
}
main().catch(e=>console.error(e.message));
