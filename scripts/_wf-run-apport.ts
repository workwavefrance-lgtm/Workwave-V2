import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const CIBLES:[number,string][]=[[11,"serrurier"],[13,"climaticien"],[37,"vitrier"],[199,"ascensoriste"],[41,"cuisiniste"],[39,"videosurveillance"],[38,"ramoneur"],[5,"menuisier"],[12,"chauffagiste"],[4,"peintre"],[36,"pisciniste"]];
async function c(catId:number, seuil?:number):Promise<number>{
  for(let e=0;e<6;e++){
    let q=sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",catId).eq("is_active",true).is("deleted_at",null);
    if(seuil) q=q.gte("id",seuil);
    const {count,error}=await q;
    if(!error&&count!==null) return count;
    await new Promise(r=>setTimeout(r,4000));
  }
  throw new Error("echec cat "+catId);
}
async function main(){
  // borne d'id : premiere ligne creee apres le debut du run (05/09 vers 00h)
  const seuil = 4441001; // mesure : premiere ligne creee le 05/09 (07:13 UTC)
  console.log("seuil d'id du run du 05/09 :", seuil);
  for(const [id,slug] of CIBLES){
    const tot=await c(id); const neuf=await c(id,seuil);
    console.log(`${slug.padEnd(20)} actives=${String(tot).padStart(8)}  creees le 05/09=${String(neuf).padStart(7)}`);
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
