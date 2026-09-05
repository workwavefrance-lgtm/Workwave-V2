import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

async function main() {
  const sb = getServiceClient();
  // Comptages cibles, exacts, avec filtres
  const q = async (label: string, build: (b: any) => any) => {
    let b = sb.from("pros").select("id", { count: "exact", head: true });
    b = build(b);
    const { count, error } = await b;
    console.log(label, "=", count, error ? "ERR " + error.message : "");
  };

  await q("pros actifs", (b: any) => b.eq("is_active", true).is("deleted_at", null));
  await q("pros actifs OUVERTS", (b: any) => b.eq("is_active", true).is("deleted_at", null).neq("etat_admin", "F"));
  await q("actifs avec google_rating", (b: any) => b.eq("is_active", true).is("deleted_at", null).not("google_rating", "is", null));
  await q("actifs OUVERTS avec google_rating>0 et reviews>0", (b: any) =>
    b.eq("is_active", true).is("deleted_at", null).neq("etat_admin", "F").gt("google_rating", 0).gt("google_reviews_count", 0));
  await q("actifs avec workwave_reviews_count>0", (b: any) =>
    b.eq("is_active", true).is("deleted_at", null).gt("workwave_reviews_count", 0));
}
main();
