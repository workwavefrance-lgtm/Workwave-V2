import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  for (const j of [1, 7, 14, 30]) {
    const depuis = new Date(Date.now() - j*86400e3).toISOString();
    const { count } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("is_active",true).is("deleted_at",null).gt("updated_at", depuis);
    console.log(`pros avec updated_at < ${j}j : ${count}`);
  }
  const { data } = await sb.from("pros").select("updated_at").eq("is_active",true).is("deleted_at",null).order("updated_at",{ascending:false}).limit(1);
  console.log(`updated_at le plus recent : ${data?.[0]?.updated_at}`);
})();
