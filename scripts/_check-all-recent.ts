import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: p } = await sb.from("projects").select("id, first_name, email, vertical, status, created_at, category_id, city_id").gte("created_at", since).order("created_at", { ascending: false });
  console.log(`Projects last 24h : ${p?.length || 0}`);
  console.table(p);
}
main();
