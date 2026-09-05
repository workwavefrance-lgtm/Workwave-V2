import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function c(f:(q:any)=>any):Promise<number>{
  for(let e=0;e<6;e++){ const {count,error}=await f(sb.from("pros").select("id",{count:"exact",head:true}));
    if(!error&&count!==null) return count; await new Promise(r=>setTimeout(r,4000)); }
  throw new Error("echec");
}
async function main(){
  const base=(q:any)=>q.eq("category_id",37).eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F");
  console.log("vitrier ouverts total            :", await c(q=>base(q)));
  console.log("vitrier ouverts sans commune     :", await c(q=>base(q).is("city_id",null)));
  // repartition par pays de la commune : on echantillonne les city_id distincts
  const { data } = await sb.from("pros").select("city_id").eq("category_id",37).eq("is_active",true).is("deleted_at",null).not("city_id","is",null).limit(1000);
  const ids=[...new Set((data||[]).map((r:any)=>r.city_id))];
  const { data: villes } = await sb.from("cities").select("id, country, department_id").in("id", ids.slice(0,300));
  const parPays: Record<string,number> = {};
  for(const v of (villes||[]) as any[]) parPays[v.country||"?"]=(parPays[v.country||"?"]||0)+1;
  console.log("pays des communes (echantillon de", (villes||[]).length, "communes distinctes) :", parPays);
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
