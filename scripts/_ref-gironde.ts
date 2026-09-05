import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
function score(p:any){let s=(p.profile_completion??0)*0.3;const fy=p.founded_year;if(fy&&fy>1900&&fy<=2026)s+=Math.min(2026-fy,20);if(p.claimed_by_user_id)s+=15;s+=Math.min((p.certifications??[]).length,5)*5;if(p.rge_certified)s+=10;if(p.has_decennale)s+=5;if(p.has_rc_pro)s+=5;s+=Math.min((p.photos??[]).length,3)*5;if(p.description)s+=Math.min(Math.floor(p.description.length/100),3)*5;const r=p.google_rating??0;if(r>=4.5)s+=30;else if(r>=4)s+=15;else if(r>=3.5)s+=5;const rc=p.google_reviews_count??0;if(rc>=10)s+=20;else if(rc>=3)s+=10;else if(rc>=1)s+=5;return Math.round(s);}
async function main(){
  const { data: cat } = await sb.from("categories").select("id,slug,vertical").eq("slug","demenagement").single();
  const { data: dep } = await sb.from("departments").select("id,code,name").eq("code","33").single();
  const ids:number[]=[]; let off=0;
  while(true){ const {data}=await sb.from("cities").select("id").eq("department_id",dep!.id).range(off,off+999);
    const r=data??[]; if(r.length===0)break; ids.push(...r.map(c=>c.id)); off+=r.length; }
  console.log("cat id",cat!.id,"dept id",dep!.id,"villes",ids.length);
  const { data, count } = await sb.from("pros")
    .select("id,name,siret,slug,founded_year,profile_completion,claimed_by_user_id,certifications,rge_certified,has_decennale,has_rc_pro,photos,description,google_rating,google_reviews_count,city_id",{count:"exact"})
    .eq("category_id",cat!.id).in("city_id",ids).is("deleted_at",null).eq("is_active",true).or(OUVERT)
    .order("claimed_by_user_id",{ascending:false,nullsFirst:false}).order("profile_completion",{ascending:false,nullsFirst:false}).limit(100);
  const pros=(data??[]).map(p=>({p,s:score(p)}));
  console.log("TOTAL demenageurs ouverts Gironde (count exact) :",count,"| charges (MAX_FETCH) :",pros.length);
  pros.sort((a,b)=>{const ac=!!a.p.claimed_by_user_id,bc=!!b.p.claimed_by_user_id;if(ac!==bc)return ac?-1:1;if(b.s!==a.s)return b.s-a.s;return String(a.p.name??"").localeCompare(String(b.p.name??""));});
  console.log("\nTOP 10 rejoue :");
  for(const [i,t] of pros.slice(0,10).entries())
    console.log(`  ${String(i+1).padStart(2)}. ${String(t.p.name).padEnd(45)} score=${String(t.s).padStart(3)} siren=${String(t.p.siret??"").slice(0,9)} pc=${t.p.profile_completion} fy=${t.p.founded_year}`);
  const top=pros.slice(0,10);
  console.log("\nnoms distincts :",new Set(top.map(t=>t.p.name)).size,"| SIREN distincts :",new Set(top.map(t=>String(t.p.siret??"").slice(0,9))).size);
  console.log("scores distincts dans le top10 :",new Set(top.map(t=>t.s)).size, "->", [...new Set(top.map(t=>t.s))]);
  // distribution des scores sur TOUT l'echantillon charge
  const sc = pros.map(t=>t.s);
  console.log("scores distincts sur les 100 charges :", new Set(sc).size, "min",Math.min(...sc),"max",Math.max(...sc));
}
main().catch(e=>console.error(e));
