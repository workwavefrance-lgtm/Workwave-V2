import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { computeProScore } from "../lib/queries/top-pros";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
function hav(a1:number,o1:number,a2:number,o2:number){const R=6371,t=(x:number)=>x*Math.PI/180;const d1=t(a2-a1),d2=t(o2-o1);const x=Math.sin(d1/2)**2+Math.cos(t(a1))*Math.cos(t(a2))*Math.sin(d2/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
async function top(catId:number,cityIds:number[]){
  const { data } = await sb.from("pros").select("id,slug,name,profile_completion,founded_year,claimed_by_user_id,certifications,rge_certified,has_decennale,has_rc_pro,photos,description,google_rating,google_reviews_count,workwave_reviews_avg,workwave_reviews_count")
    .eq("category_id",catId).in("city_id",cityIds).is("deleted_at",null).eq("is_active",true).or(OUVERT)
    .order("claimed_by_user_id",{ascending:false,nullsFirst:false}).order("profile_completion",{ascending:false,nullsFirst:false}).limit(100);
  const pros=(data??[]) as any[];
  return pros.map(p=>({p,s:computeProScore(p)})).sort((a,b)=>{const ac=!!a.p.claimed_by_user_id,bc=!!b.p.claimed_by_user_id;if(ac!==bc)return ac?-1:1;if(b.s!==a.s)return b.s-a.s;return (a.p.name??"").localeCompare(b.p.name??"");}).slice(0,10).map(x=>x.p.slug as string);
}
async function pool(lat:number,lng:number,r:number){const dLat=r/111,dLng=r/(111*Math.cos(lat*Math.PI/180));
  const {data}=await sb.from("cities").select("id,latitude,longitude").gte("latitude",lat-dLat).lte("latitude",lat+dLat).gte("longitude",lng-dLng).lte("longitude",lng+dLng).limit(1000);
  return (data??[]).filter(x=>x.latitude!=null&&hav(lat,lng,x.latitude!,x.longitude!)<=r).map(x=>x.id);}
async function main(){
  const {data:c}=await sb.from("categories").select("id").eq("slug","nettoyage-vitres").single();
  const {data:v}=await sb.from("cities").select("id,latitude,longitude").eq("slug","sartrouville").limit(1).single();
  const ids=await pool(v!.latitude!,v!.longitude!,20);
  console.log("Determinisme : 3 executions identiques du MEME top 10 (pool 20km, 1197 candidats, MAX_FETCH=100)");
  const runs:string[][]=[];
  for(let i=0;i<3;i++){ runs.push(await top(c!.id,ids)); console.log(` run${i+1} : ${runs[i].slice(0,4).join(" | ")}`); }
  const stable = JSON.stringify(runs[0])===JSON.stringify(runs[1]) && JSON.stringify(runs[1])===JSON.stringify(runs[2]);
  console.log(stable ? " => STABLE" : " => INSTABLE : le top 10 change d une execution a l autre (ordre Postgres non deterministe au-dela de MAX_FETCH)");
  // combien de candidats ont le MEME profile_completion (donc departages arbitrairement) ?
  const {data:all}=await sb.from("pros").select("profile_completion,claimed_by_user_id").eq("category_id",c!.id).in("city_id",ids).is("deleted_at",null).eq("is_active",true).or(OUVERT).limit(1500);
  const rows=(all??[]) as any[];
  const claimed=rows.filter(r=>r.claimed_by_user_id).length;
  const map:Record<string,number>={}; rows.forEach(r=>{const k=String(r.profile_completion??"null");map[k]=(map[k]||0)+1;});
  console.log(` candidats total ${rows.length}, reclames ${claimed}, distribution profile_completion :`, Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5));
}
main().catch(e=>console.error(e));
