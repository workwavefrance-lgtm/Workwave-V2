import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { count } = await sb.from("categories").select("id",{count:"exact",head:true}).eq("vertical","btp");
  console.log("categories vertical=btp (= pages chantiers dans le flux) :", count);
  const { data } = await sb.from("categories").select("vertical").limit(2000);
  const c: Record<string,number> = {};
  for (const r of (data||[])) c[r.vertical||"null"] = (c[r.vertical||"null"]||0)+1;
  console.log("repartition des verticaux :", c);
})();
