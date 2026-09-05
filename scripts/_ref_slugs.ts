import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const slugs = ["pascal-bara","s-a-r-l-morel-david","platrerie-peinture-grasso","diego-paysage"];
  for (const s of slugs) {
    const { data, error } = await sb.from("pros")
      .select("id, slug, name, is_active, deleted_at, etat_admin, city_id, category_id, city:cities(name), category:categories(name)")
      .eq("slug", s);
    console.log(s, "->", error ? "ERR "+error.message : JSON.stringify(data));
  }
  // slugs proches
  for (const like of ["%pascal-bara%","%morel-david%","%grasso%","%diego-paysage%"]) {
    const { data } = await sb.from("pros").select("slug, is_active, deleted_at, etat_admin").ilike("slug", like).limit(5);
    console.log("LIKE", like, JSON.stringify(data));
  }
})();
