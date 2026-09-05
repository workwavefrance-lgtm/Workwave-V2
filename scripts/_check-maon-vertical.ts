import {config} from "dotenv";
import path from "path";
config({path: path.resolve(process.cwd(),".env.local"),override:true});
import {createClient} from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main(){
  const {data} = await sb.from("categories").select("id,name,vertical").eq("name","Maçon").limit(3);
  console.log(data);
}
main();
