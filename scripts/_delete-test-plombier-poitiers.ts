/**
 * Soft-delete le projet test "Demande de test sans contenu réel" (Plombier, Poitiers, 6 juin 12:29).
 * Pattern : status='deleted' + nullification PII.
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Trouve par description contenant "test sans contenu réel" et créé aujourd'hui
  const { data: candidates } = await sb
    .from("projects")
    .select("id, first_name, description, status, suspicion_score, created_at, vertical")
    .ilike("description", "%test sans contenu réel%")
    .neq("status", "deleted");
  console.log(`Candidats trouvés : ${candidates?.length ?? 0}`);
  console.log(candidates);

  if (!candidates?.length) {
    console.log("Aucun projet correspondant. Tentative par date 6 juin 12:29…");
    const { data: byDate } = await sb
      .from("projects")
      .select("id, first_name, description, status, suspicion_score, created_at, vertical")
      .gte("created_at", "2026-06-06T12:00:00Z")
      .lte("created_at", "2026-06-06T13:00:00Z")
      .neq("status", "deleted")
      .order("created_at", { ascending: false });
    console.log("Par date :", byDate);
    if (!byDate?.length) { console.log("Rien trouvé."); return; }
    candidates.push(...byDate);
  }

  const ids = candidates.map((p) => p.id);
  console.log(`\nSoft-delete des projets IDs : ${ids.join(", ")}`);

  const nowIso = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb.from("projects") as any)
    .update({
      status: "deleted",
      first_name: "DELETED",
      email: "deleted@workwave.fr",
      phone: null,
      description: "[projet test supprimé]",
    })
    .in("id", ids);
  if (error) { console.error("ERREUR:", error.message); process.exit(1); }

  console.log("\n✓ Soft-delete OK. Refresh /pro/dashboard/leads pour confirmer.");
}
main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
