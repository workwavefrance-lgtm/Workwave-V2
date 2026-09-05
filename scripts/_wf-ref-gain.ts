import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DENSES = ["76","67","38","35","95","78","77","94","92","83","06","34","31","44","59","33","69","13","75"];

async function pageAll(build:(o:number)=>any){
  let all:any[]=[]; let o=0;
  while(true){ const { data, error } = await build(o); if (error) throw new Error(error.message);
    const r=data||[]; if(r.length===0) break; all.push(...r); o+=r.length; }
  return all;
}
async function main(){
  const { data: deps } = await sb.from("departments").select("id, code, country").eq("country","FR");
  const codeById = new Map((deps as any[]).map(d=>[d.id,d.code]));
  const cities = await pageAll((o)=>sb.from("cities").select("id, department_id").order("id").range(o,o+999));
  const deptOfCity = new Map(cities.map((c:any)=>[c.id,c.department_id]));
  console.log("villes chargees (toutes):", cities.length);

  // 1. repartition par dept des 19 denses, pour vitrier/serrurier/climaticien
  for (const [catId,nom] of [[37,"vitrier"],[11,"serrurier"],[13,"climaticien"]] as [number,string][]){
    const rows = await pageAll((o)=>sb.from("pros").select("id, city_id, claimed_by_user_id")
      .eq("category_id",catId).eq("is_active",true).is("deleted_at",null)
      .or("etat_admin.is.null,etat_admin.neq.F").order("id").range(o,o+999));
    const parDept = new Map<string,number>();
    for (const p of rows){ const c = codeById.get(deptOfCity.get(p.city_id) as number); if (c) parDept.set(c,(parDept.get(c)||0)+1); }
    const tot19 = DENSES.reduce((s,c)=>s+(parDept.get(c)||0),0);
    const zero19 = DENSES.filter(c=>!(parDept.get(c)||0));
    const claimed = rows.filter((p:any)=>p.claimed_by_user_id).length;
    console.log(`${nom.padEnd(12)} total=${rows.length}  sur 19 denses=${tot19}  denses a ZERO=${zero19.length} (${zero19.join(",")})  claimed=${claimed}`);
  }

  // 2. gain du reclassement, France entiere, avec la regex actuelle (LARGE)
  const REGLES = [
    {cible:"serrurier",  cat:5, nafs:["4332B"],          rx:/\bSERRUR/i},
    {cible:"vitrier",    cat:5, nafs:["4332A","4332B"],  rx:/\b(VITR|MIROIT)/i, motifs:["vitr","miroit"]},
    {cible:"vitrier",    cat:4, nafs:["4334Z"],          rx:/\b(VITR|MIROIT)/i, motifs:["vitr","miroit"]},
    {cible:"climaticien",cat:12,nafs:["4322B"],          rx:/\b(CLIM|FROID)/i,  motifs:["clim","froid"]},
    {cible:"ascensoriste",cat:36,nafs:["4329B"],         rx:/\b(ASCENS|MONTE-CHARGE)/i, motifs:["ascens","monte-charge"]},
  ] as any[];
  console.log("\n== gain du reclassement (regex LARGE actuelle), France+BE ==");
  for (const r of REGLES){
    const motifs = r.motifs ?? ["serrur"];
    const seen = new Map<number,any>();
    for (const naf of r.nafs) for (const m of motifs){
      const rows = await pageAll((o)=>sb.from("pros").select("id,name,city_id,claimed_by_user_id,naf_code")
        .eq("category_id",r.cat).eq("naf_code",naf).eq("is_active",true).is("deleted_at",null)
        .or("etat_admin.is.null,etat_admin.neq.F").ilike("name",`%${m}%`).order("id").range(o,o+999));
      for (const x of rows) seen.set(x.id,x);
    }
    const match = [...seen.values()].filter((x:any)=>r.rx.test(x.name));
    const claimed = match.filter((x:any)=>x.claimed_by_user_id).length;
    const depts = new Set(match.map((x:any)=>codeById.get(deptOfCity.get(x.city_id) as number)).filter(Boolean));
    console.log(`  ${r.cible.padEnd(13)} <- cat${r.cat}/${r.nafs.join("+")} : ilike=${seen.size} regex=${match.length} claimed=${claimed} deptsFR touches=${depts.size}`);
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
