import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function pageAll(build:(o:number)=>any){ let all:any[]=[]; let o=0;
  while(true){ const { data, error } = await build(o); if (error) throw new Error(error.message);
    const r=data||[]; if(r.length===0) break; all.push(...r); o+=r.length; } return all; }
async function main(){
  const { data: deps } = await sb.from("departments").select("id, code").eq("country","FR");
  const codeById = new Map((deps as any[]).map(d=>[d.id,d.code]));
  const cities = await pageAll(o=>sb.from("cities").select("id, department_id").order("id").range(o,o+999));
  const deptOfCity = new Map(cities.map((c:any)=>[c.id,c.department_id]));
  const dOf=(cid:number)=>codeById.get(deptOfCity.get(cid) as number);

  const CIBLES = [
    {nom:"vitrier", cat:37, src:[{cat:5,nafs:["4332A","4332B"]},{cat:4,nafs:["4334Z"]}], motifs:["vitr","miroit"], rx:/\b(VITR|MIROIT)/i},
    {nom:"serrurier", cat:11, src:[{cat:5,nafs:["4332B"]}], motifs:["serrur"], rx:/\bSERRUR/i},
    {nom:"climaticien", cat:13, src:[{cat:12,nafs:["4322B"]}], motifs:["clim","froid"], rx:/\b(CLIM|FROID)/i},
    {nom:"ascensoriste", cat:199, src:[{cat:36,nafs:["4329B"]}], motifs:["ascens","monte-charge"], rx:/\b(ASCENS|MONTE-CHARGE)/i},
  ];
  for (const C of CIBLES){
    const actuels = await pageAll(o=>sb.from("pros").select("id, city_id").eq("category_id",C.cat)
      .eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F").order("id").range(o,o+999));
    const avant = new Set(actuels.map((p:any)=>dOf(p.city_id)).filter(Boolean));
    const seen = new Map<number,any>();
    for (const s of C.src) for (const naf of s.nafs) for (const m of C.motifs){
      for (const x of await pageAll(o=>sb.from("pros").select("id,name,city_id").eq("category_id",s.cat)
        .eq("naf_code",naf).eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F")
        .ilike("name",`%${m}%`).order("id").range(o,o+999))) seen.set(x.id,x);
    }
    const gain = [...seen.values()].filter((x:any)=>C.rx.test(x.name));
    const gainFR = gain.filter((x:any)=>dOf(x.city_id));
    const apres = new Set([...avant]); gain.forEach((x:any)=>{const d=dOf(x.city_id); if(d) apres.add(d);});
    console.log(`${C.nom.padEnd(13)} AVANT fiches=${actuels.length} (FR depts couverts ${avant.size}/101, vides ${101-avant.size})`);
    console.log(`${"".padEnd(13)} GAIN  fiches=${gain.length} dont FR=${gainFR.length}`);
    console.log(`${"".padEnd(13)} APRES depts couverts ${apres.size}/101, vides ${101-apres.size}  -> pages vides comblees: ${apres.size-avant.size}`);
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
