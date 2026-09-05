import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const { data } = await sb.from("pros").select("slug,naf_code,forme_juridique,effectif_range,city_id,category_id")
    .eq("city_id", 12133).eq("category_id", 14).eq("is_active", true).is("deleted_at", null)
    .not("naf_code","is",null).neq("forme_juridique","1000").limit(3);
  console.log(JSON.stringify(data, null, 1));
})();
