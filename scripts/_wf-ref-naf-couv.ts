import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function c(f:(q:any)=>any){
  for(let e=0;e<6;e++){
    const q = f(sb.from("pros").select("id",{count:"exact",head:true}).eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F"));
    const { count, error } = await q;
    if(!error && count!==null) return count;
    await new Promise(r=>setTimeout(r,4000));
  }
  throw new Error("echec compte");
}
async function main(){
  for (const [cat,nom] of [[5,"menuisier"],[4,"peintre"],[12,"chauffagiste"],[36,"pisciniste"]] as [number,string][]){
    const tot = await c(q=>q.eq("category_id",cat));
    const nul = await c(q=>q.eq("category_id",cat).is("naf_code",null));
    console.log(`${nom.padEnd(14)} total ouvert=${String(tot).padStart(6)}  naf_code NULL=${String(nul).padStart(6)}  (${(100*nul/tot).toFixed(1)}%)`);
  }
  // combien de "SERRUR" chez menuisier TOUS naf confondus (y compris null)
  for (const [cat,nom,motif] of [[5,"menuisier","serrur"],[5,"menuisier","vitr"],[4,"peintre","vitr"],[12,"chauffagiste","clim"],[36,"pisciniste","ascens"]] as [number,string,string][]){
    const tousNaf = await c(q=>q.eq("category_id",cat).ilike("name",`%${motif}%`));
    const nafNull = await c(q=>q.eq("category_id",cat).ilike("name",`%${motif}%`).is("naf_code",null));
    console.log(`${nom}/%${motif}% : tous naf=${tousNaf}  dont naf NULL=${nafNull}`);
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
