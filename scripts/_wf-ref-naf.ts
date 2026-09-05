import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data, error } = await sb.from("categories")
    .select("id, slug, name, naf_codes, vertical")
    .contains("naf_codes", ["4329B"]);
  console.log("cats avec 4329B:", error ? error.message : JSON.stringify(data, null, 1));
  const { data: d2 } = await sb.from("categories").select("id, slug, naf_codes").in("id", [36, 199]);
  console.log("36 et 199:", JSON.stringify(d2, null, 1));
})();
