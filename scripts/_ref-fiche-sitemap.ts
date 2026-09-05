import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const AI = [43,44,45,46,47,48];
async function main() {
  const sb = getServiceClient();
  const { data: f } = await sb.from("pros").select("id,slug,etat_admin,category_id,is_active,deleted_at").eq("slug","sarl-bodin-tp-86-00026").limit(1);
  console.log("fiche exemple de l audit :", JSON.stringify(f?.[0]));
  if (!f?.[0]) return;
  const id = f[0].id;
  // rang de cette fiche dans l ordre id parmi les non-tech actives
  const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).lt("id", id)
    .not("category_id", "in", `(${AI.join(",")})`);
  console.log("rang (nb de fiches non-tech avant elle) :", count);
  console.log("=> sous-sitemap attendu : /sitemap/" + (100 + Math.floor((count||0)/45000)) + ".xml");
}
main();
