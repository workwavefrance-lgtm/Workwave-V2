import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { computeProScore } from "../lib/queries/top-pros";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
function hav(a1:number,o1:number,a2:number,o2:number){const R=6371,t=(x:number)=>x*Math.PI/180;const d1=t(a2-a1),d2=t(o2-o1);const x=Math.sin(d1/2)**2+Math.cos(t(a1))*Math.cos(t(a2))*Math.sin(d2/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
const MAX_FETCH=100, TOP=10;

// Reproduit EXACTEMENT le pipeline de top-pros.ts mais avec un pool geographique
async function top(catId:number, cityIds:number[]){
  const { data } = await sb.from("pros")
    .select("id,slug,name,profile_completion,founded_year,claimed_by_user_id,certifications,rge_certified,has_decennale,has_rc_pro,photos,description,google_rating,google_reviews_count,workwave_reviews_avg,workwave_reviews_count")
    .eq("category_id",catId).in("city_id",cityIds).is("deleted_at",null).eq("is_active",true).or(OUVERT)
    .order("claimed_by_user_id",{ascending:false,nullsFirst:false})
    .order("profile_completion",{ascending:false,nullsFirst:false})
    .limit(MAX_FETCH);
  const pros=(data??[]) as any[];
  return pros.map(p=>({p,s:computeProScore(p)}))
    .sort((a,b)=>{const ac=!!a.p.claimed_by_user_id,bc=!!b.p.claimed_by_user_id;if(ac!==bc)return ac?-1:1;if(b.s!==a.s)return b.s-a.s;return (a.p.name??"").localeCompare(b.p.name??"");})
    .slice(0,TOP).map(x=>x.p.slug as string);
}

async function poolAutour(lat:number,lng:number,rayon:number){
  const dLat=rayon/111, dLng=rayon/(111*Math.cos(lat*Math.PI/180));
  const { data } = await sb.from("cities").select("id,latitude,longitude")
    .gte("latitude",lat-dLat).lte("latitude",lat+dLat).gte("longitude",lng-dLng).lte("longitude",lng+dLng).limit(1000);
  return (data??[]).filter(x=>x.latitude!=null&&hav(lat,lng,x.latitude!,x.longitude!)<=rayon).map(x=>x.id);
}

async function main(){
  const { data: c } = await sb.from("categories").select("id").eq("slug","nettoyage-vitres").single();
  const slugs=["sartrouville","houilles","maisons-laffitte","le-vesinet","chatou","carrieres-sur-seine","montesson","bezons","argenteuil","poissy"];
  for (const rayon of [10,20]) {
    console.log(`\n===== RAYON ${rayon} km : top 10 de chaque commune voisine (nettoyage-vitres) =====`);
    const tops: Record<string,string[]> = {};
    for (const s of slugs){
      const { data: v } = await sb.from("cities").select("id,name,latitude,longitude").eq("slug",s).limit(1).single();
      if(!v?.latitude) { console.log(s,"pas de coords"); continue; }
      const ids = await poolAutour(v.latitude!, v.longitude!, rayon);
      tops[v.name] = await top(c!.id, ids);
    }
    const noms=Object.keys(tops);
    const ref=tops[noms[0]];
    console.log(`Reference ${noms[0]} : ${ref.slice(0,3).join(", ")} ...`);
    for(let i=1;i<noms.length;i++){
      const inter=tops[noms[i]].filter(x=>ref.includes(x)).length;
      console.log(`  ${noms[i].padEnd(22)} identique a ${((inter/TOP)*100).toFixed(0)}% avec ${noms[0]}  (${inter}/10 memes fiches)`);
    }
    // moyenne toutes paires
    let tot=0,np=0;
    for(let i=0;i<noms.length;i++)for(let j=i+1;j<noms.length;j++){tot+=tops[noms[j]].filter(x=>tops[noms[i]].includes(x)).length;np++;}
    console.log(`  >>> RECOUVREMENT MOYEN sur ${np} paires : ${((tot/np/TOP)*100).toFixed(1)}%`);
  }
  // Etat ACTUEL pour comparaison (filtre city_id)
  console.log("\n===== ETAT ACTUEL (filtre city_id) : recouvrement des top 10 =====");
  const cur: Record<string,string[]> = {};
  for (const s of slugs){
    const { data: v } = await sb.from("cities").select("id,name").eq("slug",s).limit(1).single();
    if(!v) continue; cur[v.name]=await top(c!.id,[v.id]);
  }
  const noms=Object.keys(cur); let tot=0,np=0;
  for(let i=0;i<noms.length;i++)for(let j=i+1;j<noms.length;j++){tot+=cur[noms[j]].filter(x=>cur[noms[i]].includes(x)).length;np++;}
  console.log(`  tailles : ${noms.map(n=>`${n}:${cur[n].length}`).join(", ")}`);
  console.log(`  >>> RECOUVREMENT MOYEN actuel sur ${np} paires : ${((tot/np/TOP)*100).toFixed(1)}%`);
}
main().catch(e=>console.error(e));
