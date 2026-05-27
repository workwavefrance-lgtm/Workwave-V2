import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Step 1: nullify events.project_id (lieu de delete events car events est une table d'audit)
  const { count: eventsCount } = await sb.from("events").select("id", { count: "exact", head: true }).not("project_id", "is", null);
  console.log(`events.project_id NOT NULL : ${eventsCount}`);

  // Set null pour rompre le FK
  const { error: e1 } = await sb.from("events").update({ project_id: null }).not("project_id", "is", null);
  if (e1) { console.error("Update events FAIL:", e1.message); process.exit(1); }
  console.log("✓ events.project_id nullified");

  // Step 2: re-try delete projects
  const { error: e2 } = await sb.from("projects").delete().gte("id", 0);
  if (e2) { console.error("Delete projects FAIL:", e2.message); process.exit(1); }
  console.log("✓ projects deleted");

  const { count: aft } = await sb.from("projects").select("id", { count: "exact", head: true });
  console.log(`projects restants : ${aft}`);
}
main();
