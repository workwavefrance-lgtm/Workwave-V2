import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main(){
  const sb=getServiceClient();
  const c = async (t:string, f?:(b:any)=>any)=>{
    let b:any = sb.from(t).select("id",{count:"exact",head:true}); if(f) b=f(b);
    const {count,error}=await b; console.log(`${t} = ${count ?? "ERR "+(error?.message||"")}`);
  };
  await c("lead_unlocks");
  await c("projects");
  await c("project_leads");
  await c("pro_reviews");
  const {data:lu}=await sb.from("lead_unlocks").select("id,pro_id,project_id,amount_cents,created_at").order("id");
  console.log("lead_unlocks detail:",JSON.stringify(lu));
  const {count:claimed}=await sb.from("pros").select("id",{count:"exact",head:true}).not("claimed_by_user_id","is",null);
  console.log("pros reclames =",claimed);
}
main();
