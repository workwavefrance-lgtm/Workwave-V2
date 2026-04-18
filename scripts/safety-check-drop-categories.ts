/**
 * Safety check avant DELETE des 3 catégories (jardinage, lavage-voiture-a-domicile, promenade-animaux).
 *
 * Vérifie qu'aucun pro de ces catégories :
 *  - n'est claimed (claimed_by_user_id != null)
 *  - n'a un abonnement Stripe (stripe_customer_id != null)
 *  - n'a reçu de leads (project_leads)
 *  - n'a reçu d'emails (email_logs)
 *  - n'est dans une email_sequence
 *
 * Si TOUT est clean : hard DELETE OK.
 * Sinon : il faut soft-delete et garder les categories en archive.
 *
 * Usage : npx tsx scripts/safety-check-drop-categories.ts
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TO_DROP = ["jardinage", "promenade-animaux", "lavage-voiture-a-domicile"];

async function main() {
  // 1. Récupérer les ids des catégories à drop
  const { data: cats } = await supabase
    .from("categories")
    .select("id, slug")
    .in("slug", TO_DROP);

  if (!cats || cats.length === 0) {
    console.log("Aucune des catégories à drop n'existe en base. Rien à faire.");
    return;
  }

  const catIds = cats.map((c) => c.id as number);
  console.log(`Catégories trouvées : ${cats.map((c) => c.slug).join(", ")}`);
  console.log(`IDs : ${catIds.join(", ")}\n`);

  // 2. Récupérer tous les pros de ces catégories
  const { data: pros, count: prosTotal } = await supabase
    .from("pros")
    .select("id, slug, name, claimed_by_user_id, stripe_customer_id, subscription_status, is_active, deleted_at", { count: "exact" })
    .in("category_id", catIds);

  console.log(`Total pros dans ces catégories : ${prosTotal}\n`);

  if (!pros || pros.length === 0) {
    console.log("Aucun pro à vérifier. Cleanup safe.");
    return;
  }

  // 3. Détecter les pros à risque
  const claimedPros = pros.filter((p) => p.claimed_by_user_id);
  const stripePros = pros.filter((p) => p.stripe_customer_id);
  const subscribedPros = pros.filter(
    (p) => p.subscription_status && !["none", "free", "canceled"].includes(p.subscription_status as string)
  );
  const activePros = pros.filter((p) => p.is_active && !p.deleted_at);

  // 4. Vérifier project_leads
  const proIds = pros.map((p) => p.id as number);
  let leadsCount = 0;
  if (proIds.length > 0) {
    // Paginer car >1000 ids potentiels
    const PAGE = 500;
    for (let i = 0; i < proIds.length; i += PAGE) {
      const chunk = proIds.slice(i, i + PAGE);
      const { count } = await supabase
        .from("project_leads")
        .select("id", { count: "exact", head: true })
        .in("pro_id", chunk);
      leadsCount += count || 0;
    }
  }

  // 5. Vérifier email_logs
  let emailsCount = 0;
  if (proIds.length > 0) {
    const PAGE = 500;
    for (let i = 0; i < proIds.length; i += PAGE) {
      const chunk = proIds.slice(i, i + PAGE);
      const { count } = await supabase
        .from("email_logs")
        .select("id", { count: "exact", head: true })
        .in("pro_id", chunk);
      emailsCount += count || 0;
    }
  }

  // 6. Vérifier email_sequences
  let sequencesCount = 0;
  if (proIds.length > 0) {
    const PAGE = 500;
    for (let i = 0; i < proIds.length; i += PAGE) {
      const chunk = proIds.slice(i, i + PAGE);
      const { count } = await supabase
        .from("email_sequences")
        .select("id", { count: "exact", head: true })
        .in("pro_id", chunk);
      sequencesCount += count || 0;
    }
  }

  // ============================================
  // VERDICT
  // ============================================
  console.log("=== ÉTAT DES PROS À DROP ===");
  console.log(`  Total                         : ${prosTotal}`);
  console.log(`  Actifs (non soft-delete)      : ${activePros.length}`);
  console.log(`  Claimed (compte utilisateur)  : ${claimedPros.length} ⚠ BLOQUANT`);
  console.log(`  Avec Stripe customer          : ${stripePros.length} ⚠ BLOQUANT`);
  console.log(`  Avec subscription active      : ${subscribedPros.length} ⚠ BLOQUANT`);
  console.log(`  Project leads reçus           : ${leadsCount}`);
  console.log(`  Email logs                    : ${emailsCount}`);
  console.log(`  Email sequences               : ${sequencesCount}`);

  console.log("\n=== VERDICT ===");
  const hasBlocking = claimedPros.length > 0 || stripePros.length > 0 || subscribedPros.length > 0;
  const hasReferences = leadsCount > 0 || emailsCount > 0 || sequencesCount > 0;

  if (hasBlocking) {
    console.log("❌ BLOQUANT — Au moins un pro a un compte / abonnement actif. NE PAS hard-delete.");
    console.log("Liste des pros bloquants :");
    [...claimedPros, ...stripePros, ...subscribedPros].forEach((p) => {
      console.log(`  - ${p.slug} (${p.name})`);
    });
    console.log("→ Recommandation : soft-delete + reclasser ces pros dans une autre catégorie manuellement.");
  } else if (hasReferences) {
    console.log("⚠ Pros référencés dans project_leads / email_logs / email_sequences.");
    console.log("→ Hard-delete provoquera erreur FK. Options :");
    console.log("   a) Soft-delete (is_active=false, deleted_at=NOW()) + garder catégorie en place");
    console.log("   b) Cascade delete via SQL (DELETE FROM project_leads + email_logs + email_sequences d'abord)");
  } else {
    console.log("✅ SAFE — Aucun pro claimed/payant, aucune référence FK. Hard-delete OK.");
  }
}

main().catch((err) => {
  console.error("Erreur:", err);
  process.exit(1);
});
