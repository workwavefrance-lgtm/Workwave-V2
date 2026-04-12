"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";
import { getStripeServer } from "@/lib/stripe/server";

// ============================================
// Helpers
// ============================================

async function getAuthenticatedPro() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getProByUserId(user.id);
}

async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

// ============================================
// Créer une Stripe Checkout Session
// ============================================

export async function createCheckoutSession(plan: "monthly" | "annual") {
  const pro = await getAuthenticatedPro();
  if (!pro) return { error: "Non authentifié" };

  const stripe = getStripeServer();
  const origin = await getOrigin();

  const priceId =
    plan === "monthly"
      ? process.env.STRIPE_PRICE_MONTHLY_ID!
      : process.env.STRIPE_PRICE_ANNUAL_ID!;

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/pro/dashboard/abonnement?success=true`,
    cancel_url: `${origin}/pro/dashboard/abonnement?canceled=true`,
    allow_promotion_codes: true,
    payment_method_types: ["card"],
    metadata: {
      pro_id: String(pro.id),
    },
  };

  // Si le pro a déjà un customer Stripe, le réutiliser
  if (pro.stripe_customer_id) {
    sessionParams.customer = pro.stripe_customer_id;
  } else {
    sessionParams.customer_email = pro.email || undefined;
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    return { url: session.url };
  } catch (err) {
    console.error("Erreur Stripe Checkout:", err);
    return { error: "Erreur lors de la création de la session de paiement" };
  }
}

// ============================================
// Créer une Stripe Customer Portal Session
// ============================================

export async function createPortalSession() {
  const pro = await getAuthenticatedPro();
  if (!pro) return { error: "Non authentifié" };

  if (!pro.stripe_customer_id) {
    return {
      error:
        "Aucun abonnement trouvé. Souscrivez d'abord pour accéder à la gestion de facturation.",
    };
  }

  const stripe = getStripeServer();
  const origin = await getOrigin();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: pro.stripe_customer_id,
      return_url: `${origin}/pro/dashboard/abonnement`,
    });
    return { url: session.url };
  } catch (err) {
    console.error("Erreur Stripe Portal:", err);
    return { error: "Erreur lors de l'ouverture du portail de facturation" };
  }
}

// ============================================
// Résilier l'abonnement (cancel_at_period_end)
// ============================================

export async function cancelSubscription(reason: string, feedback: string) {
  const pro = await getAuthenticatedPro();
  if (!pro) return { error: "Non authentifié" };

  if (!pro.stripe_subscription_id) {
    return { error: "Aucun abonnement actif à résilier" };
  }

  const supabase = await createClient();

  // Sauvegarder l'enquête de sortie
  await supabase.from("cancellation_feedback").insert({
    pro_id: pro.id,
    reason,
    feedback: feedback || null,
  });

  // Résilier à la fin de la période
  const stripe = getStripeServer();
  try {
    await stripe.subscriptions.update(pro.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
  } catch (err) {
    console.error("Erreur Stripe Cancel:", err);
    return { error: "Erreur lors de la résiliation" };
  }

  revalidatePath("/pro/dashboard/abonnement");
  revalidatePath("/pro/dashboard");
  return { success: true };
}
