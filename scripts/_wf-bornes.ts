import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  const {data:max}=await sb.from("pros").select("id, created_at, etat_verifie_at, name").order("id",{ascending:false}).limit(3);
  console.log("dernieres lignes :", JSON.stringify(max));
  for (const id of [4300000,4441001,4600000,5000000]) {
    const {data}=await sb.from("pros").select("id, created_at").gte("id",id).order("id").limit(1);
    console.log("id >=",id,"->",JSON.stringify(data));
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
