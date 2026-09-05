import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

async function main() {
  const sb = getServiceClient();
  const { data, error } = await sb.from("pros").select("id", { count: "exact", head: true }).not("google_rating", "is", null);
  console.log("erreur brute:", JSON.stringify(error));

  // table pro_reviews (petite)
  const { count: nrev, error: e2 } = await sb.from("pro_reviews").select("id", { count: "exact", head: true });
  console.log("pro_reviews total =", nrev, e2?.message ?? "");
  const { data: rev } = await sb.from("pro_reviews").select("id,pro_id,rating,status,created_at").limit(20);
  console.log("echantillon pro_reviews:", JSON.stringify(rev));
}
main();
