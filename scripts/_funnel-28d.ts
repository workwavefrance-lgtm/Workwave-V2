/**
 * Funnel de conversion 28 jours (BTP workwave.fr).
 * Combine GSC (trafic organique, saisi en constante) + Supabase (projets,
 * broadcasts, unlocks). Lecture seule.
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Depuis ta capture GSC (28 derniers jours)
const GSC_ORGANIC_CLICKS_28D = 4890;

(async () => {
  const since = new Date(Date.now() - 28 * 86400e3).toISOString();

  // 1) Projets déposés (28j) : tous + BTP
  const { count: projTotal } = await sb
    .from("projects").select("id", { count: "exact", head: true })
    .gte("created_at", since).neq("status", "deleted");
  const { count: projBtp } = await sb
    .from("projects").select("id", { count: "exact", head: true })
    .gte("created_at", since).neq("status", "deleted").eq("vertical", "btp");
  const { count: projTech } = await sb
    .from("projects").select("id", { count: "exact", head: true })
    .gte("created_at", since).neq("status", "deleted").eq("vertical", "tech");

  // 2) Projets BTP effectivement broadcastés (broadcast_count > 0)
  const { count: projBroadcast } = await sb
    .from("projects").select("id", { count: "exact", head: true })
    .gte("created_at", since).neq("status", "deleted").eq("vertical", "btp")
    .gt("broadcast_count", 0);

  // 3) Projets BTP avec AU MOINS 1 pro ciblé vs 0 pro éligible
  const { data: btpProjects } = await sb
    .from("projects").select("id, broadcast_count, suspicion_score")
    .gte("created_at", since).neq("status", "deleted").eq("vertical", "btp");
  const withTargets = (btpProjects || []).filter((p) => (p.broadcast_count ?? 0) > 0).length;
  const zeroTargets = (btpProjects || []).filter((p) => (p.broadcast_count ?? 0) === 0).length;

  // 4) Unlocks payés (28j) + CA
  const { data: unlocks } = await sb
    .from("lead_unlocks").select("id, amount_paid, created_at, project_id")
    .gte("created_at", since);
  const unlockCount = unlocks?.length ?? 0;
  const revenue = (unlocks || []).reduce((s, u) => s + (Number(u.amount_paid) || 9.9), 0);

  // 5) Pros claimed (total, pas sur 28j : c'est le pool)
  const { count: prosClaimed } = await sb
    .from("pros").select("id", { count: "exact", head: true })
    .not("claimed_by_user_id", "is", null).eq("is_active", true).is("deleted_at", null);

  // ───────── Affichage ─────────
  const pct = (a: number, b: number) => (b > 0 ? ((a / b) * 100).toFixed(2) + "%" : "-");
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║           FUNNEL DE CONVERSION · 28 DERNIERS JOURS           ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  console.log("ÉTAPE 1 · TRAFIC");
  console.log(`  Clics organiques Google (GSC)        ${GSC_ORGANIC_CLICKS_28D}`);
  console.log(`  (NB : hors trafic direct/social/IA, le total GA4 est plus élevé)\n`);

  console.log("ÉTAPE 2 · PROJETS DÉPOSÉS");
  console.log(`  Total projets                        ${projTotal}`);
  console.log(`    dont BTP                           ${projBtp}`);
  console.log(`    dont Tech (AI)                     ${projTech}`);
  console.log(`  → Taux conversion visite→projet      ${pct(projTotal || 0, GSC_ORGANIC_CLICKS_28D)} (sur le seul organique Google)\n`);

  console.log("ÉTAPE 3 · BROADCAST AUX PROS (BTP)");
  console.log(`  Projets BTP avec ≥1 pro ciblé        ${withTargets}`);
  console.log(`  Projets BTP avec 0 pro éligible      ${zeroTargets}  ← manque de pros claimed dans la zone/métier`);
  console.log(`  → Taux de couverture                 ${pct(withTargets, projBtp || 0)}\n`);

  console.log("ÉTAPE 4 · MONÉTISATION");
  console.log(`  Unlocks payés (9,90€)                ${unlockCount}`);
  console.log(`  CA généré                            ${revenue.toFixed(2)} €`);
  console.log(`  → Taux projet→unlock                 ${pct(unlockCount, projBtp || 0)}\n`);

  console.log("CONTEXTE");
  console.log(`  Pros claimed (pool qui reçoit)       ${prosClaimed}`);
  console.log("");

  // Diagnostic automatique du plus gros goulot
  console.log("──────────── DIAGNOSTIC ────────────");
  const convVisitProj = (projTotal || 0) / GSC_ORGANIC_CLICKS_28D;
  if (convVisitProj < 0.005) {
    console.log("🔴 GOULOT #1 = CONVERSION visite→projet (<0,5%). Le trafic est là");
    console.log("   mais ne se transforme pas en projets. Levier : CTA, formulaires");
    console.log("   inline (déployés hier), réassurance, UX du tunnel dépôt.");
  }
  if ((zeroTargets) > (withTargets)) {
    console.log("🔴 GOULOT #2 = COUVERTURE PRO. Plus de projets tombent sur 0 pro");
    console.log("   éligible que l'inverse. Levier : recruter des pros claimed.");
  }
  console.log("");
})();
