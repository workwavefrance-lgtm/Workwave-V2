/**
 * Helper Workwave AI : creer une Stripe Checkout Session pour Premium.
 *
 * Reutilisable depuis :
 *   - app/(ai)/ai/dashboard/abonnement/actions.ts (bouton "Activer Premium")
 *   - app/(ai)/ai/inscription/actions.ts (inscription avec plan='premium')
 *
 * Caracteristiques :
 *   - trial_period_days: 14 (Stripe gere automatiquement le passage payant)
 *   - Customer cree ou reutilise idempotemment (metadata.pro_id)
 *   - locale: fr, allow_promotion_codes: true
 *   - success_url / cancel_url customisables
 *
 * Retour : { url } a rediriger ou { error } si fail.
 */
import { getStripeServer } from "@/lib/stripe/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type CheckoutInput = {
  proId: number;
  email: string;
  name: string;
  plan: "monthly" | "annual";
  existingCustomerId?: string | null;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createAiCheckoutSession(
  input: CheckoutInput
): Promise<CheckoutResult> {
  const priceId =
    input.plan === "annual"
      ? process.env.STRIPE_AI_PRICE_ANNUAL_ID
      : process.env.STRIPE_AI_PRICE_MONTHLY_ID;

  if (!priceId) {
    console.error("[createAiCheckoutSession] STRIPE_AI_PRICE_*_ID missing");
    return { ok: false, error: "stripe_not_configured" };
  }

  const stripe = getStripeServer();
  let customerId = input.existingCustomerId || null;

  // Si on a un existingCustomerId, verifier qu'il n'est pas deleted/invalid
  // dans Stripe (cas : un ancien customer Premium qui a ete deleted soft par
  // l'admin ou pendant une migration). Si deleted, on ignore et on cree.
  if (customerId) {
    try {
      const cus = await stripe.customers.retrieve(customerId);
      if ("deleted" in cus && cus.deleted) {
        console.warn(
          `[createAiCheckoutSession] customer ${customerId} marked deleted in Stripe, ignoring`
        );
        customerId = null;
      }
    } catch (e) {
      console.warn(
        `[createAiCheckoutSession] customer ${customerId} retrieve failed (${e instanceof Error ? e.message : "unknown"}), ignoring`
      );
      customerId = null;
    }
  }

  // Cherche Customer existant via metadata.pro_id (idempotent)
  if (!customerId) {
    try {
      const search = await stripe.customers.search({
        query: `metadata['pro_id']:'${input.proId}' AND metadata['vertical']:'ai'`,
        limit: 1,
      });
      if (search.data.length > 0) {
        customerId = search.data[0].id;
      }
    } catch (searchErr) {
      console.warn(
        "[createAiCheckoutSession] customers.search failed:",
        searchErr
      );
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: input.email,
        name: input.name || undefined,
        metadata: { pro_id: String(input.proId), vertical: "ai" },
      });
      customerId = customer.id;
    }

    // Persist customer ID dans pros pour les prochaines fois
    const sb = getServiceClient();
    await sb
      .from("pros")
      .update({ stripe_customer_id: customerId })
      .eq("id", input.proId);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { pro_id: String(input.proId), vertical: "ai" },
      },
      metadata: { pro_id: String(input.proId), vertical: "ai" },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      locale: "fr",
      billing_address_collection: "auto",
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return { ok: false, error: "checkout_url_missing" };
    }
    return { ok: true, url: session.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[createAiCheckoutSession] checkout failed:", msg);
    return { ok: false, error: msg.slice(0, 200) };
  }
}
