import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("categories").select("id,slug,naf_codes,vertical").in("id", [1,2,3,4,5]);
  console.log(JSON.stringify(data, null, 1));
})();
