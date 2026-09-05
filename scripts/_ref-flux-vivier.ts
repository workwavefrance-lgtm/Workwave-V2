import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  console.log("fiches eligibles au flux, par jour de updated_at :");
  for (let d = 0; d <= 15; d++) {
    const hi = new Date(Date.now() - d*86400e3).toISOString();
    const lo = new Date(Date.now() - (d+1)*86400e3).toISOString();
    const { count } = await sb.from("pros").select("id",{count:"exact",head:true})
      .eq("is_active",true).is("deleted_at",null).gt("updated_at",lo).lte("updated_at",hi);
    console.log(`  il y a ${String(d).padStart(2)} j : ${String(count ?? 0).padStart(7)} fiches`);
  }
})();
