import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  const rows:any[]=[]; let off=0;
  while(true){
    const {data,error}=await sb.from("pros").select("id, city_id, naf_code")
      .eq("category_id",37).eq("is_active",true).is("deleted_at",null)
      .or("etat_admin.is.null,etat_admin.neq.F").order("id").range(off,off+999);
    if(error){ console.error(error.message); break; }
    const r=data||[]; if(!r.length) break; rows.push(...r); off+=r.length;
  }
  console.log("vitrier ouverts lus :", rows.length);
  const ids=[...new Set(rows.map(r=>r.city_id).filter(Boolean))];
  const villes:any[]=[];
  for(let i=0;i<ids.length;i+=200){
    const {data}=await sb.from("cities").select("id, country, department_id").in("id", ids.slice(i,i+200));
    villes.push(...(data||[]));
  }
  const {data:deps}=await sb.from("departments").select("id, code, country");
  const dById=new Map((deps as any[]).map(d=>[d.id,d]));
  const vById=new Map(villes.map((v:any)=>[v.id,v]));
  const parDept:Record<string,number>={}; let sansVille=0, sansCommuneConnue=0;
  for(const r of rows){
    if(!r.city_id){sansVille++;continue;}
    const v=vById.get(r.city_id); if(!v){sansCommuneConnue++;continue;}
    const d:any=dById.get(v.department_id);
    const k=d?`${d.country}-${d.code}`:"sans-dept";
    parDept[k]=(parDept[k]||0)+1;
  }
  const tri=Object.entries(parDept).sort((a,b)=>b[1]-a[1]);
  console.log("sans city_id :",sansVille," commune introuvable :",sansCommuneConnue);
  console.log("top 15 depts :", tri.slice(0,15).map(([k,v])=>`${k}=${v}`).join("  "));
  console.log("nb depts distincts :", tri.length, "| somme :", tri.reduce((s,[,v])=>s+v,0));
  const naf:Record<string,number>={};
  for(const r of rows) naf[r.naf_code||"NULL"]=(naf[r.naf_code||"NULL"]||0)+1;
  console.log("naf_code des vitriers :", Object.entries(naf).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k}=${v}`).join("  "));
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
