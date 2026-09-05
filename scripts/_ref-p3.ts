import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function moisPar(catId:number, deptCode:string){
  const d=(await sb.from("departments").select("id").eq("code",deptCode).single()).data!.id;
  const { data: cs } = await sb.from("cities").select("id").eq("department_id", d);
  const ids=(cs??[]).map(c=>c.id);
  const by: Record<string,number>={}; let off=0;
  while(true){
    const { data } = await sb.from("pros").select("created_at").eq("category_id",catId).in("city_id",ids).is("deleted_at",null).eq("is_active",true).range(off,off+999);
    const rows=data??[]; if(rows.length===0) break;
    for(const r of rows){const m=(r.created_at||"").slice(0,7); by[m]=(by[m]||0)+1;}
    off+=rows.length;
  }
  return by;
}
async function main(){
  for(const d of ["75","69","13","59","33","31","06","44","34","76"]){
    const by=await moisPar(1,d);
    const tot=Object.values(by).reduce((a,b)=>a+b,0);
    const apresFix=Object.entries(by).filter(([m])=>m>="2026-08").reduce((a,[,v])=>a+v,0);
    console.log(`dept ${d} plombier total=${String(tot).padStart(5)} | apres 08/2026 = ${String(apresFix).padStart(5)} | detail ${JSON.stringify(by)}`);
  }
}
main().catch(e=>console.error(e));
