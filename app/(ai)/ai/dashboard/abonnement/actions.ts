"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getStripeServer } from "@/lib/stripe/server";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import { createAiCheckoutSession } from "@/lib/stripe/create-ai-checkout";

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
  const plan = String(formData.get("plan") || "monthly") as "monthly" | "annual";

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

  // 3) Creer la Checkout Session via helper centralise
  const result = await createAiCheckoutSession({
    proId: pro.id,
    email: pro.email || user.email,
    name: pro.name || "",
    plan: plan === "annual" ? "annual" : "monthly",
    existingCustomerId: pro.stripe_customer_id,
    successUrl: `${BASE_URL}/ai/dashboard/abonnement?activated=1`,
    cancelUrl: `${BASE_URL}/ai/dashboard/abonnement?canceled=1`,
  });

  if (!result.ok) {
    redirect(
      `/ai/dashboard/abonnement?error=${
        result.error === "stripe_not_configured"
          ? "stripe_not_configured"
          : "checkout_url_missing"
      }`
    );
  }

  redirect(result.url);
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
    // Fix #17 : fallback vers Checkout au lieu de bloquer l'user.
    // Si BDD desynchro avec Stripe (pas de customer enregistre), on
    // propose d'activer Premium plutot que d'afficher une erreur.
    redirect("/ai/dashboard/abonnement?error=no_subscription_yet");
  }

  const stripe = getStripeServer();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: pro.stripe_customer_id,
    return_url: `${BASE_URL}/ai/dashboard/abonnement`,
  });

  redirect(portalSession.url);
}
