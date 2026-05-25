"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getStripeServer } from "@/lib/stripe/server";

const AI_CATEGORY_IDS = [43, 44, 45, 46, 47, 48];
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Server Action : demarrer un Stripe Checkout pour Workwave AI Premium.
 * Cree (ou reutilise) le Stripe Customer associe au pro, puis redirige
 * vers Stripe Checkout (hosted page).
 */
export async function startCheckout(formData: FormData): Promise<void> {
  const plan = String(formData.get("plan") || "monthly");
  const priceId =
    plan === "annual"
      ? process.env.STRIPE_AI_PRICE_ANNUAL_ID
      : process.env.STRIPE_AI_PRICE_MONTHLY_ID;

  if (!priceId) {
    console.error("[startCheckout] STRIPE_AI_PRICE_*_ID not set in env");
    redirect("/ai/dashboard/abonnement?error=stripe_not_configured");
  }

  // 1) Verifier auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) redirect("/ai/connexion");

  // 2) Recuperer pro tech
  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select("id, stripe_customer_id, email, name")
    .eq("claimed_by_user_id", user.id)
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!pro) redirect("/ai/connexion?error=no_pro");

  // 3) Stripe Customer : reutiliser ou creer
  const stripe = getStripeServer();
  let customerId = pro.stripe_customer_id as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: pro.email || user.email,
      name: pro.name || undefined,
      metadata: { pro_id: String(pro.id), vertical: "ai" },
    });
    customerId = customer.id;
    await service
      .from("pros")
      .update({ stripe_customer_id: customerId })
      .eq("id", pro.id);
  }

  // 4) Creer la Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { pro_id: String(pro.id), vertical: "ai" },
    },
    metadata: { pro_id: String(pro.id), vertical: "ai" },
    success_url: `${BASE_URL}/ai/dashboard/abonnement?activated=1`,
    cancel_url: `${BASE_URL}/ai/dashboard/abonnement?canceled=1`,
    locale: "fr",
    billing_address_collection: "auto",
    allow_promotion_codes: true,
  });

  if (!session.url) {
    redirect("/ai/dashboard/abonnement?error=checkout_url_missing");
  }

  redirect(session.url);
}

/**
 * Server Action : ouvrir le Stripe Customer Portal (gestion carte, factures,
 * resiliation). Stripe gere entierement l'UI.
 */
export async function openCustomerPortal(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ai/connexion");

  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select("stripe_customer_id")
    .eq("claimed_by_user_id", user.id)
    .in("category_id", AI_CATEGORY_IDS)
    .maybeSingle();

  if (!pro?.stripe_customer_id) {
    redirect("/ai/dashboard/abonnement?error=no_stripe_customer");
  }

  const stripe = getStripeServer();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: pro.stripe_customer_id,
    return_url: `${BASE_URL}/ai/dashboard/abonnement`,
  });

  redirect(portalSession.url);
}
