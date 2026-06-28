/**
 * Helper Workwave BTP : creer une Stripe Checkout Session one-time pour
 * debloquer les coordonnees d'UN lead specifique.
 *
 * Modele : 9,90 EUR TTC par lead. Pas d'abonnement (sprint 13 — switch
 * complet du subscription mensuel au pay-per-lead).
 *
 * Idempotence cote Stripe :
 *   - On reuse le Customer du pro (par metadata.pro_id si existe)
 *   - metadata.project_id sur la session pour matching cote webhook
 *
 * Idempotence cote BDD (table lead_unlocks) :
 *   - UNIQUE (project_id, pro_id) : meme si le webhook joue 2x, INSERT
 *     est rejete avec code 23505 et on ignore.
 */
import { getStripeServer } from "@/lib/stripe/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type BtpUnlockCheckoutInput = {
  proId: number;
  projectId: number;
  email: string;
  name: string;
  existingCustomerId?: string | null;
  successUrl: string;
  cancelUrl: string;
  /** Vertical du pro/projet — "btp" (defaut) ou "tech" (freelance AI). Sert au
   *  metadata client Stripe + description. Le prix (9,90 €) et le routing
   *  webhook (product="btp_lead_unlock" → lead_unlocks) sont communs aux deux. */
  vertical?: "btp" | "tech";
};

export type BtpUnlockCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createBtpUnlockCheckoutSession(
  input: BtpUnlockCheckoutInput
): Promise<BtpUnlockCheckoutResult> {
  const priceId = process.env.STRIPE_BTP_LEAD_UNLOCK_PRICE_ID;
  if (!priceId) {
    console.error("[createBtpUnlockCheckoutSession] STRIPE_BTP_LEAD_UNLOCK_PRICE_ID missing");
    return { ok: false, error: "stripe_not_configured" };
  }

  const stripe = getStripeServer();
  const vertical = input.vertical || "btp";
  let customerId = input.existingCustomerId || null;

  // Si on a un existingCustomerId, verifier qu'il n'est pas deleted/invalid
  // dans Stripe (cas reel : un ancien customer Premium BTP qui a ete deleted
  // soft par l'admin ou pendant une migration). Si deleted, on ignore et
  // on en cree un nouveau via la branche ci-dessous.
  if (customerId) {
    try {
      const cus = await stripe.customers.retrieve(customerId);
      if ("deleted" in cus && cus.deleted) {
        console.warn(
          `[createBtpUnlockCheckoutSession] customer ${customerId} marked deleted in Stripe, ignoring`
        );
        customerId = null;
      }
    } catch (e) {
      // Customer doesn't exist anymore : ignore et recree
      console.warn(
        `[createBtpUnlockCheckoutSession] customer ${customerId} retrieve failed (${e instanceof Error ? e.message : "unknown"}), ignoring`
      );
      customerId = null;
    }
  }

  // Idempotent customer search via metadata.pro_id + vertical='btp'
  if (!customerId) {
    try {
      const search = await stripe.customers.search({
        query: `metadata['pro_id']:'${input.proId}' AND metadata['vertical']:'${vertical}'`,
        limit: 1,
      });
      if (search.data.length > 0) {
        customerId = search.data[0].id;
      }
    } catch (searchErr) {
      console.warn("[createBtpUnlockCheckoutSession] customers.search failed:", searchErr);
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: input.email,
        name: input.name || undefined,
        metadata: { pro_id: String(input.proId), vertical },
      });
      customerId = customer.id;
    }

    // Persist dans pros pour les prochains unlocks
    const sb = getServiceClient();
    await sb
      .from("pros")
      .update({ stripe_customer_id: customerId })
      .eq("id", input.proId);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment", // one-time, PAS subscription
      line_items: [{ price: priceId, quantity: 1 }],
      // Metadata pour le webhook : on match par project_id + pro_id
      metadata: {
        pro_id: String(input.proId),
        project_id: String(input.projectId),
        vertical,
        product: "btp_lead_unlock",
      },
      payment_intent_data: {
        // metadata aussi sur le PaymentIntent (defense en profondeur webhook)
        metadata: {
          pro_id: String(input.proId),
          project_id: String(input.projectId),
          vertical: "btp",
          product: "btp_lead_unlock",
        },
        description: `Workwave — Deblocage lead #${input.projectId}`,
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      locale: "fr",
      billing_address_collection: "auto",
      // Pas d'allow_promotion_codes pour le BTP unlock (prix fixe)
    });

    if (!session.url) {
      return { ok: false, error: "checkout_url_missing" };
    }
    return { ok: true, url: session.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[createBtpUnlockCheckoutSession] checkout failed:", msg);
    return { ok: false, error: msg.slice(0, 200) };
  }
}
