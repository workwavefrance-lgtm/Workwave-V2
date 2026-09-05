import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data } = await sb.from("pros")
    .select("slug,name,google_rating,google_reviews_count,etat_admin,is_active,city_id,category_id")
    .gt("google_reviews_count", 5).gt("google_rating", 0)
    .eq("is_active", true).is("deleted_at", null)
    .order("google_reviews_count", { ascending: false }).limit(8);
  console.table(data);
})();
