/**
 * Sprint 13 — Migration BTP du modele subscription au pay-per-lead.
 *
 * Les 5 pros actuellement en `subscription_status='trialing'` cote BTP
 * sont passes en `subscription_status='none'` (le subscription_product
 * reste 'btp' pour audit historique).
 *
 * Ces pros gardent :
 *   - Leur claim (claimed_by_user_id intact)
 *   - L'auto-subscribe au broadcast BTP (vu qu'ils sont claimed)
 *   - Leur fiche publique active
 *
 * Ce qu'ils perdent :
 *   - L'illusion d'un trial Premium (ils etaient en trial gratuit, pas de
 *     facturation prevue de toute facon)
 *
 * Ce qu'ils gagnent :
 *   - Plus de pression "essai gratuit qui se termine"
 *   - Acces gratuit a tous les projets de leur zone
 *   - Peuvent unlock 9,90 EUR par projet quand ils veulent
 *
 * Idempotent : safe a relancer (no-op si pas de trial pro).
 */
import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AI_CATEGORY_IDS = [
  43, 44, 45, 46, 47, 48, 79, 80, 81, 82, 83, 85, 86, 87,
];

async function main() {
  console.log("\n=== Migration BTP trialing -> none ===\n");

  // Trouver tous les pros BTP en trialing
  // BTP = category_id NOT IN AI_CATEGORY_IDS (sauf si subscription_product='btp' explicite)
  const { data: trialing } = await sb
    .from("pros")
    .select(
      "id, name, email, category_id, subscription_status, subscription_product, subscription_plan, stripe_subscription_id"
    )
    .eq("subscription_status", "trialing");

  if (!trialing || trialing.length === 0) {
    console.log("Aucun pro en trialing. Migration no-op.");
    return;
  }

  console.log(`${trialing.length} pros en trialing :`);
  console.table(
    trialing.map((p) => ({
      id: p.id,
      name: p.name,
      cat: p.category_id,
      product: p.subscription_product,
      subId: p.stripe_subscription_id ? "yes" : "no",
    }))
  );

  // Distinguer BTP (NOT IN AI) vs AI (IN AI)
  const btpTrials = trialing.filter(
    (p) => !AI_CATEGORY_IDS.includes(p.category_id)
  );
  const aiTrials = trialing.filter((p) =>
    AI_CATEGORY_IDS.includes(p.category_id)
  );

  console.log(`\n  - BTP trials : ${btpTrials.length}`);
  console.log(`  - AI trials  : ${aiTrials.length} (on laisse intacts)`);

  if (btpTrials.length === 0) {
    console.log("\nAucun pro BTP a migrer.");
    return;
  }

  // Migrer BTP trials -> subscription_status='none'
  // On garde subscription_product='btp' pour audit (savoir qu'il etait en trial BTP avant).
  const btpIds = btpTrials.map((p) => p.id);
  const { data: updated, error } = await sb
    .from("pros")
    .update({
      subscription_status: "none",
      subscription_plan: null,
      // stripe_subscription_id : on garde, c'est juste un historique
      current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .in("id", btpIds)
    .select("id, name, subscription_status");

  if (error) {
    console.error("\n❌ UPDATE failed :", error.message);
    process.exit(1);
  }

  console.log(`\n✓ ${updated?.length || 0} pros BTP migres :`);
  console.table(updated);

  // Aussi : si certains de ces pros ont une Stripe subscription active en mode trial,
  // on l'annule cote Stripe (best-effort, non-bloquant)
  const stripeSubsToCancel = btpTrials.filter(
    (p) => p.stripe_subscription_id
  );
  if (stripeSubsToCancel.length > 0) {
    console.log(
      `\n${stripeSubsToCancel.length} subscriptions Stripe a annuler (best-effort)...`
    );
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
    for (const p of stripeSubsToCancel) {
      try {
        await stripe.subscriptions.cancel(p.stripe_subscription_id!);
        console.log(`  ✓ Cancel ${p.stripe_subscription_id} (pro ${p.id})`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // No_such_subscription = deja annulee, c'est OK
        if (msg.includes("No such subscription")) {
          console.log(`  - Skip ${p.stripe_subscription_id} (deja annulee)`);
        } else {
          console.warn(`  ⚠ Cancel ${p.stripe_subscription_id} failed : ${msg}`);
        }
      }
    }
  }

  console.log("\n=== Migration OK ===");
}

main().catch((e) => {
  console.error("\n❌ Erreur fatale :", e);
  process.exit(1);
});
