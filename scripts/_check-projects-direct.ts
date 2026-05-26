import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const result = await sb
    .from("projects")
    .select("id, vertical, category_id, status, first_name, email, created_at")
    .order("id", { ascending: false })
    .limit(10);
  
  console.log("Result error:", result.error);
  console.log("Result count:", result.count);
  console.log("Result data length:", result.data?.length);
  console.log("Result data:");
  console.log(JSON.stringify(result.data, null, 2));
}
main().catch((e) => {
  console.error("CATCH:", e);
});
