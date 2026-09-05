import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const { count, error } = await sb.from("listing_cat_ville").select("*", { count: "exact", head: true });
  console.log("listing_cat_ville count:", count, "err:", error?.message);
  const { data } = await sb.from("listing_cat_ville").select("metier,ville,n").order("n", { ascending: false }).limit(3);
  console.log("top:", JSON.stringify(data));
}
main();
