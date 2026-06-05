import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: projects } = await sb
    .from("projects")
    .select("id, vertical, category_id, status, first_name, email, description, created_at, deleted_at")
    .order("id", { ascending: false })
    .limit(15);
  
  console.log(`Last 15 projects (all):`);
  console.table(projects);

  // Also check events log
  const { data: events } = await sb
    .from("events")
    .select("event_type, properties, created_at")
    .ilike("event_type", "%project%")
    .order("created_at", { ascending: false })
    .limit(10);
  console.log("\nLast project-related events:");
  console.table(events);
}
main();
