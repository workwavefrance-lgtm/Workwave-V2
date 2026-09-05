/**
 * Le projet #55 (Plaquiste à Limoges, créé 02/06/2026) a-t-il été
 * broadcasté à Ben Interieur (seul pro claimed dans le 87) ?
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  // 1. État du projet #55
  const { data: project } = await sb
    .from("projects")
    .select("id, vertical, status, broadcast_count, broadcasted_at, created_at, category_id, city_id, description")
    .eq("id", 55)
    .single();
  console.log("══ Projet #55 ══");
  console.log(JSON.stringify(project, null, 2));

  // 2. Ben Interieur : fiche
  const { data: ben } = await sb
    .from("pros")
    .select("id, name, email, claimed_by_user_id, claimed_at, intervention_radius_km, category_id, secondary_category_ids, paused_until, do_not_contact, source, is_active, deleted_at, city:cities(name, department_id)")
    .ilike("name", "%Ben Interieur%")
    .single();
  console.log("\n══ Ben Interieur (pro claimed Limoges) ══");
  console.log(JSON.stringify(ben, null, 2));

  // 3. Trace dans email_logs ? (table audit envois)
  if (ben) {
    const { data: logs } = await sb
      .from("email_logs")
      .select("*")
      .eq("pro_id", ben.id)
      .order("created_at", { ascending: false })
      .limit(5);
    console.log("\n══ email_logs pour Ben Interieur (5 derniers) ══");
    console.log(logs);
  }

  // 4. project_leads ? (table audit broadcasts par pro)
  const { data: leads } = await sb
    .from("project_leads")
    .select("*")
    .eq("project_id", 55);
  console.log("\n══ project_leads pour projet #55 ══");
  console.log(leads);
})();
