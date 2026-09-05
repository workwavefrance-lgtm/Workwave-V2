import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
// Charge toutes les villes FR avec leur dept, puis compte les fiches ouvertes par dept
// en chargeant les city_id des fiches (les volumes sont petits : <3000 par cat).
async function main(){
  // villes FR -> dept code
  const { data: deps, error: e1 } = await sb.from("departments").select("id, code, name, country").eq("country","FR");
  if (e1) throw new Error(e1.message);
  const deptById = new Map((deps as any[]).map(d=>[d.id,d]));
  console.log("departements FR:", (deps as any[]).length);
  let cities:any[]=[]; let off=0;
  while(true){
    const { data, error } = await sb.from("cities").select("id, department_id").eq("country","FR").order("id").range(off,off+999);
    if (error) throw new Error(error.message);
    const rows=data||[]; if(rows.length===0) break; cities.push(...rows); off+=rows.length;
  }
  console.log("villes FR:", cities.length);
  const deptOfCity = new Map(cities.map(c=>[c.id,c.department_id]));

  for (const [catId,nom] of [[37,"vitrier"],[11,"serrurier"],[13,"climaticien"],[39,"videosurveillance"],[41,"cuisiniste"],[199,"ascensoriste"]] as [number,string][]){
    let rows:any[]=[]; let o=0;
    while(true){
      const { data, error } = await sb.from("pros").select("id, city_id")
        .eq("category_id",catId).eq("is_active",true).is("deleted_at",null)
        .or("etat_admin.is.null,etat_admin.neq.F").order("id").range(o,o+999);
      if (error) throw new Error(error.message);
      const r=data||[]; if(r.length===0) break; rows.push(...r); o+=r.length;
    }
    const presents = new Set<number>();
    for (const p of rows){ const d = deptOfCity.get(p.city_id); if (d!==undefined) presents.add(d); }
    const vides = (deps as any[]).filter(d=>!presents.has(d.id));
    console.log(`${nom.padEnd(20)} fiches FR+BE=${rows.length}  depts FR avec >=1 = ${presents.size}  depts FR VIDES = ${vides.length}`);
    if (nom==="vitrier") console.log("   exemples vides:", vides.slice(0,12).map(d=>d.code).join(" "));
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
