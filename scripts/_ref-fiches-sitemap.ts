import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const tech = [43,44,45,46,47,48,79,80,81,82,83,85,86,87];
  const { count: actifs } = await sb.from("pros").select("*", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null);
  const { count: actifsTech } = await sb.from("pros").select("*", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null).in("category_id", tech);
  console.log("pros actifs (tous)      :", actifs);
  console.log("pros actifs tech        :", actifsTech);
  console.log("pros actifs NON tech    :", (actifs||0)-(actifsTech||0), "  <- ce que couvrent /sitemap/100..147 (48 x 45 000 = 2 160 000)");
}
main();
