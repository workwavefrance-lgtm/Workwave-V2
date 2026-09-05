import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const AI = [43,44,45,46,47,48];
async function main() {
  const sb = getServiceClient();
  const { count: nonTech } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).not("category_id", "in", `(${AI.join(",")})`);
  console.log("pros actifs non tech (= ce que le sitemap declare) :", nonTech);
  const { count: ouvertsNonTech } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).not("category_id", "in", `(${AI.join(",")})`)
    .not("etat_admin", "eq", "F");
  console.log("dont OUVERTS :", ouvertsNonTech);
}
main().catch(e => console.log("ERR", e.message));
