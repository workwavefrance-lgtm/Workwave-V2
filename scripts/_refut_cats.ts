import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

(async () => {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("categories")
    .select("id, slug, name, vertical")
    .in("vertical", ["btp", "domicile", "personne"])
    .order("id");
  if (error) { console.error(error); process.exit(1); }
  console.log("nb categories BTP/domicile/personne :", data!.length);
  console.log(data!.map((c) => c.slug).join(" "));
})();
