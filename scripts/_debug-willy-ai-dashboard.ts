/**
 * Debug round 4 : avec les BONS champs (description, vertical).
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  console.log("══ 1. Projets tech (AI vertical) · vertical='tech' ══");
  const { data: techProjects, error: e1 } = await sb
    .from("projects")
    .select("id, first_name, description, category_id, vertical, status, created_at, suspicion_score, broadcast_count")
    .eq("vertical", "tech")
    .order("created_at", { ascending: false });
  console.log("ERROR:", e1);
  console.log(`COUNT tech: ${techProjects?.length ?? 0}`);
  console.log(techProjects);

  console.log("\n══ 2. Projets dont la description contient 'test' ══");
  const { data: tests, error: e2 } = await sb
    .from("projects")
    .select("id, first_name, description, category_id, vertical, status, created_at, broadcast_count, broadcasted_at")
    .ilike("description", "%test%")
    .order("created_at", { ascending: false });
  console.log("ERROR:", e2);
  console.log(tests);

  console.log("\n══ 3. project_leads pour les 2 pros willy (1432477, 1432478) ══");
  const { data: leads, error: e3 } = await sb
    .from("project_leads")
    .select("id, project_id, pro_id, sent_at, status")
    .in("pro_id", [1432477, 1432478]);
  console.log("ERROR:", e3);
  console.log("LEADS:", leads);
}

main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
