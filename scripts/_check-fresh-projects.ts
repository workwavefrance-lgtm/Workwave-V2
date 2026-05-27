import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await sb.from("projects").select("id, first_name, email, category_id, vertical, status, created_at").order("created_at", { ascending: false }).limit(10);
  console.log("Last 10 projects (apres wipe + submission user) :");
  console.log("  error:", error?.message || "none");
  console.log("  data length:", data?.length);
  if (data) console.table(data);
}
main();
