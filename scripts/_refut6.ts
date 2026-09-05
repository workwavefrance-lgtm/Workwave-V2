import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const { data: cats } = await sb.from("categories").select("id,vertical");
  const tech = (cats||[]).filter((c:any)=>c.vertical==="tech").map((c:any)=>c.id);
  console.log("categories tech (vertical='tech') :", tech.length);
  const { count: nonTechVertical } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).not("category_id", "in", `(${tech.join(",")})`);
  console.log("pros actifs NON tech par vertical (= univers de la RPC du sitemap) :", nonTechVertical);
  console.log("URL fiches reellement servies par les sitemaps 100..142 : 1931164 (mesure curl)");
  console.log("ecart :", (nonTechVertical||0) - 1931164);
}
main().catch(e=>console.log("ERR", e.message));
