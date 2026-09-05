import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  const { data: c1 } = await sb.from("cities").select("*").limit(1);
  console.log("colonnes cities:", Object.keys((c1 as any[])[0]).join(", "));
  const { data: d1 } = await sb.from("departments").select("*").limit(1);
  console.log("colonnes departments:", Object.keys((d1 as any[])[0]).join(", "));
  // Toutes les fiches vitrier ouvertes, avec ville + dept
  let all:any[] = []; let off=0;
  while(true){
    const { data, error } = await sb.from("pros")
      .select("id,name,naf_code,postal_code,city_id,cities(name,department_id,departments(code,name,country))")
      .eq("category_id",37).eq("is_active",true).is("deleted_at",null)
      .or("etat_admin.is.null,etat_admin.neq.F").order("id").range(off,off+999);
    if (error) throw new Error(error.message);
    const rows = data||[]; if (rows.length===0) break; all.push(...rows); off+=rows.length;
  }
  console.log("vitrier ouvertes chargees:", all.length);
  const parPays = new Map<string,number>();
  const parNaf = new Map<string,number>();
  for (const p of all){
    const co = (p as any).cities?.departments?.country ?? "(null)";
    parPays.set(co,(parPays.get(co)||0)+1);
    parNaf.set(p.naf_code||"(null)",(parNaf.get(p.naf_code||"(null)")||0)+1);
  }
  console.log("par pays:", [...parPays.entries()].sort((a,b)=>b[1]-a[1]));
  console.log("par naf :", [...parNaf.entries()].sort((a,b)=>b[1]-a[1]));
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
