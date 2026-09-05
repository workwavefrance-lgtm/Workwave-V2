import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("categories").select("id, slug, naf_codes, vertical").in("vertical", ["domicile", "personne"]).order("vertical");
  for (const c of data || []) console.log(`${String(c.vertical).padEnd(10)} ${String(c.slug).padEnd(26)} ${(c.naf_codes||[]).join(",")}`);
  console.log(`${(data||[]).length} categories`);
})();
