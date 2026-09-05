import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  const { data: c } = await sb.from("cities").select("*").limit(1);
  console.log("colonnes cities :", Object.keys(c?.[0]??{}).join(", "));
  const { data: d } = await sb.from("commune_data").select("*").limit(1);
  console.log("\ncolonnes commune_data :", Object.keys(d?.[0]??{}).join(", "));
  const { count } = await sb.from("commune_data").select("insee_code",{count:"exact",head:true});
  console.log("lignes commune_data :", count);
}
main().catch(e=>console.error(e.message));
