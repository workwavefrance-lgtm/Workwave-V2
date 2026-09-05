import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERTS="etat_admin.is.null,etat_admin.neq.F";
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function c(cat:number,essai=0):Promise<number|null>{
  const {count,error}=await sb.from("pros").select("id",{count:"exact",head:true})
    .eq("category_id",cat).eq("is_active",true).is("deleted_at",null).or(OUVERTS);
  if(error){if(essai<3){await sleep(4000);return c(cat,essai+1);}return null;}
  return count!;
}
(async()=>{
  const {data:cats}=await sb.from("categories").select("id,slug,name,naf_codes,vertical")
    .in("vertical",["domicile","personne"]).order("vertical").order("id");
  console.log("VERTICAL\tID\tSLUG\tNAF\tFICHES_OUVERTES_FRANCE");
  for(const k of cats as any[]){
    const n=await c(k.id);
    console.log(`${k.vertical}\t${k.id}\t${k.slug}\t${(k.naf_codes||[]).join(",")||"AUCUN"}\t${n===null?"ERREUR":n}`);
  }
})();
