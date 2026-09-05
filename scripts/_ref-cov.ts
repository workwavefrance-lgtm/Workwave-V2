import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT="etat_admin.is.null,etat_admin.neq.F";
async function main(){
  const { data: mm } = await sb.from("pros").select("id").order("id",{ascending:false}).limit(1);
  const maxId = mm![0].id as number;
  const rows:any[]=[];
  for(let k=0;k<15;k++){
    const start=Math.floor((maxId/15)*k);
    const { data, error } = await sb.from("pros").select("id,etab_latitude,etab_longitude,siren,siret")
      .is("deleted_at",null).eq("is_active",true).or(OUVERT).gte("id",start).order("id").limit(1000);
    if(error){console.log("ERR",error.message);return;}
    rows.push(...(data??[]));
  }
  const n=rows.length;
  const p=(c:number)=>`${c}/${n} = ${(100*c/n).toFixed(2)}%`;
  console.log(`ECHANTILLON ${n} fiches ouvertes (15 tranches)`);
  console.log("  etab_latitude+longitude :", p(rows.filter(r=>r.etab_latitude!=null&&r.etab_longitude!=null).length));
  console.log("  siren renseigne         :", p(rows.filter(r=>!!r.siren).length));
  console.log("  siret renseigne         :", p(rows.filter(r=>!!r.siret).length));
  console.log("  siren == siret[0:9]     :", p(rows.filter(r=>r.siren&&r.siret&&r.siren===String(r.siret).slice(0,9)).length));
}
main().catch(e=>console.error(e));
