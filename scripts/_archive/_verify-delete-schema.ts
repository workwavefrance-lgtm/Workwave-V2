import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Test that email_blacklist exists by trying a SELECT
  const { error: ebError } = await sb.from("email_blacklist").select("email").limit(1);
  console.log("email_blacklist:", ebError ? `ERROR: ${ebError.message}` : "OK");

  // Test that pros has do_not_contact
  const { data, error } = await sb.from("pros").select("id, do_not_contact, deleted_at, subscription_status, stripe_subscription_id").limit(1);
  console.log("pros do_not_contact + deleted_at + subscription_status:", error ? `ERROR: ${error.message}` : "OK");
  console.log("sample row:", data?.[0]);
}
main();
