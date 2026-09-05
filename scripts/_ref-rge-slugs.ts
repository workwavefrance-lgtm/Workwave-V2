import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("departments").select("id,code,name,slug").in("code",["49","26","94"]);
  console.log(JSON.stringify(data,null,1));
})().catch(e=>{console.error(e.message);process.exit(1);});
