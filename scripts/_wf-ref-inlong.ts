import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  for (const n of [500, 1000, 1400, 2000]){
    const ids = Array.from({length:n},(_,i)=>1000000+i);
    const t0=Date.now();
    const { error, count } = await sb.from("pros").select("id",{count:"exact",head:true}).in("id", ids);
    console.log(`in() avec ${n} ids -> ${error ? "ERREUR: "+error.message.slice(0,120) : "OK count="+count} (${Date.now()-t0}ms)`);
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
