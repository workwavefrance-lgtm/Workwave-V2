import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

async function main() {
  const sb = getServiceClient();
  const tot = await sb.from("pro_reviews").select("*", { count: "exact", head: true });
  console.log("pro_reviews TOTAL:", tot.count, "err:", tot.error?.message || "none");
  const pub = await sb.from("pro_reviews").select("*", { count: "exact", head: true }).eq("status", "published");
  console.log("pro_reviews published:", pub.count, "err:", pub.error?.message || "none");
  // pros avec rating agrege eventuel
  for (const col of ["rating", "review_count", "google_rating", "google_review_count", "rating_count"]) {
    const r = await sb.from("pros").select("id", { count: "exact", head: true }).not(col, "is", null);
    console.log(`pros.${col} non-null:`, r.count ?? "COLONNE ABSENTE", r.error ? "(" + r.error.message.slice(0, 60) + ")" : "");
  }
}
main();
