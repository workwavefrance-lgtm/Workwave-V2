import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const PARIS = 12133;
async function ech(cat:number, naf:string, motif:string, n=12){
  const {data,error}=await sb.from("pros").select("name")
    .eq("category_id",cat).eq("naf_code",naf).eq("city_id",PARIS)
    .eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F")
    .ilike("name",`%${motif}%`).limit(n);
  if(error) { console.log("  erreur", error.message); return; }
  console.log(`  ${naf}/${motif} :`, (data||[]).map((r:any)=>r.name).join(" | "));
}
async function main(){
  console.log("Echantillons de noms (Paris) pour juger les faux positifs du motif\n");
  console.log("menuisier -> serrurier");   await ech(5,"4332B","serrur");
  console.log("chauffagiste -> climaticien"); await ech(12,"4322B","clim");
  console.log("pisciniste -> ascensoriste");  await ech(36,"4329B","ascens");
  console.log("peintre -> vitrier");          await ech(4,"4334Z","vitr");
  console.log("menuisier -> cuisiniste");     await ech(5,"4332A","cuisin");
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
