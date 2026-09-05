import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
async function charger(catId:number, ids:number[]){
  const { data } = await sb.from("pros").select("id,name")
    .eq("category_id",catId).in("city_id",ids).is("deleted_at",null).eq("is_active",true).or(OUVERT)
    .order("claimed_by_user_id",{ascending:false,nullsFirst:false}).order("profile_completion",{ascending:false,nullsFirst:false}).limit(100);
  return (data??[]).map(r=>r.id as number);
}
async function main(){
  // Plombier (grosse categorie) x Nord 59 : beaucoup plus de 100 pros eligibles
  const { data: cat } = await sb.from("categories").select("id").eq("slug","plombier").single();
  const { data: dep } = await sb.from("departments").select("id").eq("code","59").single();
  const ids:number[]=[]; let off=0;
  while(true){ const {data}=await sb.from("cities").select("id").eq("department_id",dep!.id).range(off,off+999);
    const r=data??[]; if(r.length===0)break; ids.push(...r.map(c=>c.id)); off+=r.length; }
  const { count } = await sb.from("pros").select("id",{count:"exact",head:true})
    .eq("category_id",cat!.id).in("city_id",ids).is("deleted_at",null).eq("is_active",true).or(OUVERT);
  console.log(`Plombiers ouverts dans le Nord (59) : ${count} eligibles, MAX_FETCH=100 en charge`);
  const runs:number[][]=[];
  for(let i=0;i<5;i++) runs.push(await charger(cat!.id, ids));
  for(let i=0;i<5;i++) console.log(`  run ${i+1} : 5 premiers ids = ${runs[i].slice(0,5).join(",")}`);
  const setRef=new Set(runs[0]);
  for(let i=1;i<5;i++){
    const diff=runs[i].filter(x=>!setRef.has(x)).length;
    console.log(`  run ${i+1} vs run 1 : ${diff}/100 lignes differentes | ordre identique ? ${JSON.stringify(runs[i])===JSON.stringify(runs[0])}`);
  }
}
main().catch(e=>console.error(e));
