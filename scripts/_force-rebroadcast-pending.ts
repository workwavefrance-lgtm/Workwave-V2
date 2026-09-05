/**
 * 🚨 URGENT : force re-broadcast des 6 projets en attente.
 * Bug : `after()` Next 16 n'a pas exécuté broadcastBtpProject() en prod.
 * Conséquence : 13 pros claimed n'ont jamais reçu de notif → 0€ depuis 10j.
 *
 * Ce script appelle broadcastBtpProject() en standalone sur chaque projet où
 * broadcast_count = 0 et status != 'deleted'. C'est un fix manuel temporaire
 * en attendant qu'on trouve la cause racine du bug after() en prod.
 *
 * Usage :
 *   npx tsx scripts/_force-rebroadcast-pending.ts --dry-run   # liste sans envoyer
 *   npx tsx scripts/_force-rebroadcast-pending.ts             # envoie réellement
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { broadcastBtpProject } from "@/lib/email/broadcast-btp-project";

const DRY = process.argv.includes("--dry-run");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // 1. Sélectionne les projets BTP en attente de broadcast
  const { data: projects, error } = await sb
    .from("projects")
    .select("id, first_name, description, category_id, city_id, budget, urgency, status, vertical, suspicion_score, created_at")
    .eq("vertical", "btp")
    .neq("status", "deleted")
    .eq("broadcast_count", 0)
    .order("created_at", { ascending: false });
  if (error) { console.error("ERREUR query:", error); process.exit(1); }

  console.log(`Projets BTP à re-broadcast : ${projects?.length ?? 0}\n`);

  if (!projects?.length) { console.log("Rien à faire."); return; }

  // 2. Pour chaque projet : récupère catégorie + ville → broadcast
  for (const p of projects) {
    const [{ data: cat }, { data: cit }] = await Promise.all([
      sb.from("categories").select("id, name").eq("id", p.category_id).single(),
      sb.from("cities").select("id, name, department_id").eq("id", p.city_id).single(),
    ]);
    if (!cat || !cit) {
      console.log(`  ✗ projet #${p.id} : cat ou ville introuvable, skip`);
      continue;
    }
    const age = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400e3);
    console.log(`  → projet #${p.id} (J-${age}) cat=${cat.name} ville=${cit.name} dept=${cit.department_id}`);

    if (DRY) { console.log(`     [DRY] skip`); continue; }

    try {
      const result = await broadcastBtpProject({
        projectId: p.id,
        projectTitle: p.description?.split("\n")[0].slice(0, 100) || "Nouveau projet",
        projectDescription: p.description || "",
        projectBudget: p.budget || null,
        projectTimeline: p.urgency || null,
        projectCategoryName: cat.name,
        projectCategoryId: cat.id,
        projectCityName: cit.name,
        projectCityId: cit.id,
        projectDepartmentId: cit.department_id,
        isSuspicious: (p.suspicion_score ?? 0) >= 50,
      });
      console.log(`     ✓ ${result.sent}/${result.totalTargets} envoyés, ${result.failed} fail`);
    } catch (e) {
      console.error(`     ✗ ERREUR :`, (e as Error).message);
    }
    // anti-rate-limit Resend
    await new Promise((r) => setTimeout(r, 1500));
  }

  // 3. Récap après
  const { data: after } = await sb
    .from("projects")
    .select("id, broadcast_count")
    .in("id", projects.map((p) => p.id));
  console.log(`\nAprès broadcast :`);
  for (const p of after || []) {
    console.log(`  #${p.id} : broadcast_count = ${p.broadcast_count}`);
  }
}

main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
