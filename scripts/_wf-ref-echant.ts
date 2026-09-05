import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function pageAll(build:(o:number)=>any){ let all:any[]=[]; let o=0;
  while(true){ const { data, error } = await build(o); if (error) throw new Error(error.message);
    const r=data||[]; if(r.length===0) break; all.push(...r); o+=r.length; } return all; }
async function main(){
  const LOTS = [
    {nom:"climaticien", cat:12, naf:"4322B", motifs:["clim","froid"], rx:/\b(CLIM|FROID)/i},
    {nom:"ascensoriste", cat:36, naf:"4329B", motifs:["ascens","monte-charge"], rx:/\b(ASCENS|MONTE-CHARGE)/i},
    {nom:"serrurier", cat:5, naf:"4332B", motifs:["serrur"], rx:/\bSERRUR/i},
  ];
  for (const L of LOTS){
    const seen=new Map<number,string>();
    for (const m of L.motifs) for (const x of await pageAll(o=>sb.from("pros").select("id,name")
      .eq("category_id",L.cat).eq("naf_code",L.naf).eq("is_active",true).is("deleted_at",null)
      .or("etat_admin.is.null,etat_admin.neq.F").ilike("name",`%${m}%`).order("id").range(o,o+999))) seen.set(x.id,x.name);
    const ok=[...seen.values()].filter(n=>L.rx.test(n));
    console.log(`\n=== ${L.nom} : ${ok.length} retenus / ${seen.size} ilike ===`);
    // echantillon reparti : 1 sur N
    const pas = Math.max(1, Math.floor(ok.length/30));
    ok.filter((_,i)=>i%pas===0).slice(0,30).forEach(n=>console.log("   ", n));
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
