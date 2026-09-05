/**
 * Enquête : pourquoi project_leads = 0 alors qu'on a 11 projets ?
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  console.log("Audit funnel projet → routing → pro\n");

  // 1. Tous les projets non-deleted, avec leur status + broadcast_count
  const { data: projects } = await sb.from("projects")
    .select("id, first_name, vertical, category_id, city_id, status, suspicion_score, broadcast_count, broadcasted_at, admin_notified_at, created_at")
    .neq("status", "deleted")
    .order("created_at", { ascending: false });
  console.log(`══ Projets non-deleted (${projects?.length}) ══`);
  for (const p of projects || []) {
    const age = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400e3);
    console.log(`  #${p.id} [${p.vertical}] ${p.status} score=${p.suspicion_score} broadcast=${p.broadcast_count}× admin_mail=${p.admin_notified_at ? "✓" : "✗"} (J-${age})`);
  }

  // 2. project_leads : 0 selon l'audit, je confirme
  const { count: leadsCount } = await sb.from("project_leads").select("*", { count: "exact", head: true });
  console.log(`\n══ project_leads : ${leadsCount} (le routage scoré 3-pros) ══`);

  // 3. lead_unlocks (pay-per-lead BTP) : qui a unlocké quoi
  const { data: unlocks } = await sb.from("lead_unlocks").select("id, project_id, pro_id, amount_cents, created_at");
  console.log(`\n══ lead_unlocks (pay-per-lead 9.90€) ══`);
  for (const u of unlocks || []) {
    console.log(`  unlock #${u.id} projet=#${u.project_id} pro=#${u.pro_id} ${(u.amount_cents/100).toFixed(2)}€  ${u.created_at?.slice(0, 10)}`);
  }

  // 4. Pros claimed : qui sont-ils ? Ont-ils été notifiés sur les 11 projets ?
  const { data: claimedPros } = await sb.from("pros")
    .select("id, name, category_id, city_id, source, claimed_at, subscription_status")
    .not("claimed_by_user_id", "is", null)
    .order("claimed_at", { ascending: false });
  console.log(`\n══ Pros claimed (${claimedPros?.length}) ══`);
  for (const p of claimedPros || []) {
    const age = p.claimed_at ? Math.floor((Date.now() - new Date(p.claimed_at).getTime()) / 86400e3) : "?";
    console.log(`  #${p.id} ${p.name.slice(0, 30).padEnd(30)} cat=${p.category_id} src=${p.source} sub=${p.subscription_status} (claim J-${age})`);
  }

  // 5. Vérification : le système broadcast-btp-project est-il appelé sur les projets ?
  // → broadcast_count > 0 ET broadcasted_at != null
  console.log(`\n══ Broadcast · projets ayant déclenché des emails aux pros ══`);
  const broadcasted = (projects || []).filter((p) => p.broadcast_count > 0);
  console.log(`  ${broadcasted.length}/${projects?.length} projets ont broadcast_count > 0`);
  if (broadcasted.length > 0) {
    console.log(`  → Si broadcast > 0 ET project_leads = 0, c'est que le broadcast envoie aux pros claimed seulement (pas via project_leads).`);
    console.log(`  → C'est by design selon CLAUDE.md (modèle pay-per-lead, pas abonnement routing).`);
  }
}

main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
