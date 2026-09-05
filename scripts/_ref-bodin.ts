import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const tech = [43,44,45,46,47,48,79,80,81,82,83,85,86,87];
  const { data } = await sb.from("pros").select("id,slug,category_id,etat_admin").eq("slug", "sarl-bodin-tp-86-00026").limit(1);
  const p: any = (data || [])[0];
  console.log("fiche :", JSON.stringify(p));
  const { count } = await sb.from("pros").select("*", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).not("category_id", "in", `(${tech.join(",")})`).lt("id", p.id);
  console.log("rang parmi les fiches non tech triees par id :", count, "-> sous-sitemap", 100 + Math.floor((count||0)/45000));
}
main();
