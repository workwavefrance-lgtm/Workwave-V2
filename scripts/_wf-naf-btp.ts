import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data, error } = await sb.from("categories").select("id, slug, naf_codes, vertical").eq("vertical", "btp").order("id");
  if (error) throw new Error(error.message);
  let n = 0;
  for (const c of data || []) { const k = (c.naf_codes || []).length; n += k; console.log(`${String(c.slug).padEnd(22)} ${(c.naf_codes||[]).join(",")}`); }
  console.log(`\n${(data||[]).length} categories btp, ${n} codes NAF au total`);
})();
