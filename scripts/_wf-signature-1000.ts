import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function cityIds(deptCode:string){
  const {data:d,error}=await sb.from("departments").select("id").eq("code",deptCode).single(); if(error)throw error;
  const ids:number[]=[];let off=0;
  while(true){const {data,error:e}=await sb.from("cities").select("id").eq("department_id",d.id).range(off,off+999);
    if(e)throw e; if(!data||data.length===0)break; ids.push(...data.map((r:any)=>r.id)); off+=data.length;}
  return ids;
}
async function compte(naf:string,ids:number[],essai=0):Promise<number|null>{
  const {count,error}=await sb.from("pros").select("id",{count:"exact",head:true}).eq("naf_code",naf).in("city_id",ids);
  if(error){ if(essai<4){await sleep(5000);return compte(naf,ids,essai+1);} return null;}
  return count!;
}
const PAIRS:[string,string][]=[["9609Z","75"],["9609Z","13"],["5320Z","75"],["5320Z","13"],
 ["8121Z","75"],["8121Z","13"],["8559A","75"],["4339Z","75"],["8899B","75"],["8891A","75"],
 ["9522Z","13"],["4942Z","13"],["8899A","13"],["9601A","75"],["3832Z","33"],["8129A","33"]];
(async()=>{
  const cache:Record<string,number[]>={};
  console.log("NAF\tDEPT\tFICHES_TOUS_ETATS_EN_BASE");
  for(const [naf,d] of PAIRS){
    if(!cache[d])cache[d]=await cityIds(d);
    const c=await compte(naf,cache[d]);
    console.log(`${naf}\t${d}\t${c===null?"NULL(erreur)":c}`);
  }
})();
