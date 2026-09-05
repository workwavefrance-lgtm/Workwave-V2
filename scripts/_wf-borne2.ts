import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function dateDe(id:number){ const {data,error}=await sb.from("pros").select("id, created_at").gte("id",id).order("id").limit(1);
  if(error) throw error; return (data as any[])[0]; }
async function main(){
  let bas=4300000, haut=4441001;
  while(haut-bas>1){ const mid=Math.floor((bas+haut)/2); const r=await dateDe(mid);
    if(r && r.created_at >= "2026-09-05") haut=mid; else bas=mid; }
  const r=await dateDe(haut);
  console.log("premier id du 05/09 :", JSON.stringify(r));
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
