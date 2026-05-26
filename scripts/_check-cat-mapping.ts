import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data } = await sb
    .from("categories")
    .select("id, slug, name, vertical")
    .in("id", [43, 44, 45, 46, 47, 48, 79, 80, 81, 82, 83, 85, 86, 87])
    .order("id");
  console.log("BDD categories mapping:");
  console.table(data);
}
main();
