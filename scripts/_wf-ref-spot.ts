import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DENSES = ["76","67","38","35","95","78","77","94","92","83","06","34","31","44","59","33","69","13","75"];
async function main(){
  const { data: deps } = await sb.from("departments").select("id, code").in("code",DENSES).eq("country","FR");
  const ids = (deps as any[]).map(d=>d.id);
  let cities:any[]=[]; let o=0;
  while(true){ const { data } = await sb.from("cities").select("id, department_id").in("department_id",ids).order("id").range(o,o+999);
    const r=data||[]; if(r.length===0) break; cities.push(...r); o+=r.length; }
  const set = new Set(cities.map(c=>c.id));
  // macon (3) et ramoneur (38) : charger et compter ceux dont city_id est dans les 19 denses
  for (const [cat,nom] of [[38,"ramoneur"],[36,"pisciniste"]] as [number,string][]){
    let rows:any[]=[]; let k=0;
    while(true){ const { data, error } = await sb.from("pros").select("id,city_id").eq("category_id",cat)
      .eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F").order("id").range(k,k+999);
      if(error) throw new Error(error.message); const r=data||[]; if(r.length===0) break; rows.push(...r); k+=r.length; }
    console.log(`${nom.padEnd(12)} total ouvert=${rows.length}  sur 19 denses=${rows.filter(p=>set.has(p.city_id)).length}`);
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
