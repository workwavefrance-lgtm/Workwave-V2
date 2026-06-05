import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const r1 = await sb
    .from("projects")
    .select("*")
    .in("id", [39, 40]);
  console.log("Projects #39 and #40 raw:");
  console.log("  error:", r1.error);
  console.log("  count:", r1.count);
  console.log("  data:");
  console.log(JSON.stringify(r1.data, null, 2));
}
main().catch((e) => console.error("CATCH:", e));
