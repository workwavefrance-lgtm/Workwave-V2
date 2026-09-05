import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data, error } = await sb.from("departments").select("*").in("code",["49","26"]);
  if (error) console.log("ERR", error.message);
  console.log(JSON.stringify(data,null,1));
})().catch(e=>{console.error(e.message);process.exit(1);});
