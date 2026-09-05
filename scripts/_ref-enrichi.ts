import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  const q = (f:(x:any)=>any,l:string)=>f(sb.from("pros").select("id",{count:"exact",head:true})).then((r:any)=>console.log(l.padEnd(50), r.error?("ERR "+r.error.message):r.count));
  await q(x=>x.not("sirene_enrichi_at","is",null), "pros avec sirene_enrichi_at (enrichissement fait)");
  await q(x=>x.not("sirene_enrichi_at","is",null).eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F"), "  dont actifs + OUVERTS");
  await q(x=>x.eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F"), "total fiches OUVERTES");
}
main().catch(e=>console.error(e.message));
