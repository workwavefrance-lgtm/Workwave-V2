import path from "path"; import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const { count, error } = await sb.from("listing_cat_ville").select("metier", { count: "exact", head: true });
  console.log("lignes matview :", count, error?.message);
  const { count: c1 } = await sb.from("pros").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("is_active", true).or("etat_admin.is.null,etat_admin.neq.F");
  console.log("pros ouverts actifs (toutes categories) :", c1);
}
main();
