import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  console.log("== ai_signups for dcoformalite@gmail.com ==");
  const { data: signups } = await sb.from("ai_signups").select("*").eq("email", "dcoformalite@gmail.com");
  console.table(signups);

  console.log("\n== pros for dcoformalite@gmail.com ==");
  const { data: pros } = await sb.from("pros").select("id, slug, name, email, category_id, claimed_by_user_id, is_active, source, created_at").or("email.eq.dcoformalite@gmail.com,name.ilike.%boumeddane%");
  console.table(pros);

  console.log("\n== pros la plus recente (10) ==");
  const { data: recent } = await sb.from("pros").select("id, slug, name, email, category_id, source, created_at").gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).order("created_at", { ascending: false });
  console.table(recent);
}
main();
