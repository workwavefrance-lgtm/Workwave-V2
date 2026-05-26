import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: signups } = await sb
    .from("ai_signups")
    .select("id, email, first_name, last_name, category_slug, pro_id, status")
    .order("id", { ascending: false })
    .limit(20);
  console.log("Last 20 ai_signups:");
  console.table(signups);

  // For each pro_id, check what category it actually got
  const proIds = (signups || []).filter((s) => s.pro_id).map((s) => s.pro_id);
  if (proIds.length > 0) {
    const { data: pros } = await sb
      .from("pros")
      .select("id, name, category_id, claimed_by_user_id, email")
      .in("id", proIds);
    console.log("\nActual pros rows for those signups:");
    console.table(pros);
  }
}
main();
