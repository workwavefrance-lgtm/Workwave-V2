import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeServer } from "@/lib/stripe/server";
import { sendPaymentFailedEmail } from "@/lib/email/send-payment-failed";
import { track } from "@/lib/analytics/track";
import { EVENTS } from "@/lib/analytics/events";

// Supabase service client (pas de cookies dans un webhook)
async function getServiceClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Déterminer le plan + le produit (BTP ou AI) à partir du price ID
// Workwave BTP Pro     : STRIPE_PRICE_{MONTHLY,ANNUAL}_ID (39€/mois, 390€/an)
// Workwave AI Premium  : STRIPE_AI_PRICE_{MONTHLY,ANNUAL}_ID (29,90€/mois, 299€/an)
type PlanInfo = {
  plan: "monthly" | "annual" | null;
  product: "btp" | "ai" | null;
};

function getPlanFromPriceId(priceId: string): PlanInfo {
  if (priceId === process.env.STRIPE_PRICE_MONTHLY_ID) {
    return { plan: "monthly", product: "btp" };
  }
  if (priceId === process.env.STRIPE_PRICE_ANNUAL_ID) {
    return { plan: "annual", product: "btp" };
  }
  if (priceId === process.env.STRIPE_AI_PRICE_MONTHLY_ID) {
    return { plan: "monthly", product: "ai" };
  }
  if (priceId === process.env.STRIPE_AI_PRICE_ANNUAL_ID) {
    return { plan: "annual", product: "ai" };
  }
  return { plan: null, product: null };
}

// ============================================
// Handlers par événement
// ============================================

/**
 * Sprint 13 — BTP Lead Unlock.
 * Un pro BTP paie 9,90 EUR TTC one-time pour debloquer les coordonnees
 * d'un particulier sur un projet specifique. INSERT dans lead_unlocks.
 *
 * Idempotence : UNIQUE (project_id, pro_id). Si meme couple deja unlocke
 * (webhook joue 2x, ou pro re-paie par erreur), on ignore avec un log.
 */
async function handleBtpLeadUnlock(session: Stripe.Checkout.Session) {
  const proIdStr = session.metadata?.pro_id;
  const projectIdStr = session.metadata?.project_id;
  if (!proIdStr || !projectIdStr) {
    console.warn(
      "[handleBtpLeadUnlock] session metadata manquante (pro_id ou project_id)"
    );
    return;
  }
  const proId = parseInt(proIdStr, 10);
  const projectId = parseInt(projectIdStr, 10);
  if (isNaN(proId) || isNaN(projectId)) {
    console.warn(
      `[handleBtpLeadUnlock] pro_id ou project_id non-numerique : ${proIdStr}/${projectIdStr}`
    );
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntentId) {
    console.warn(
      `[handleBtpLeadUnlock] session sans payment_intent (session ${session.id})`
    );
    return;
  }

  const supabase = await getServiceClient();
  const { error: insertError } = await supabase.from("lead_unlocks").insert({
    project_id: projectId,
    pro_id: proId,
    stripe_payment_intent_id: paymentIntentId,
    stripe_checkout_session_id: session.id,
    amount_cents: session.amount_total || 990,
    currency: session.currency || "eur",
    paid_at: new Date().toISOString(),
  });

  if (insertError) {
    // Code 23505 = duplicate key (UNIQUE project_id+pro_id) = deja unlock
    if (insertError.code === "23505") {
      console.log(
        `[handleBtpLeadUnlock] deja unlock (project ${projectId}, pro ${proId}), skip idempotent`
      );
      return;
    }
    // Autre erreur : log mais on continue (mieux vaut crier dans les logs)
    console.error(
      `[handleBtpLeadUnlock] INSERT lead_unlocks failed (${insertError.code}):`,
      insertError.message
    );
    return;
  }

  // Tracking analytics (fire-and-forget)
  track(EVENTS.SUBSCRIPTION_COMPLETED, {
    proId,
    metadata: {
      type: "btp_lead_unlock",
      projectId,
      amountCents: session.amount_total || 990,
    },
  });

  console.log(
    `[handleBtpLeadUnlock] OK — pro ${proId} a unlock le projet ${projectId} (${(session.amount_total || 990) / 100}€)`
  );
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const proId = session.metadata?.pro_id;
  if (!proId) {
    console.warn("Webhook checkout.session.completed sans pro_id dans metadata");
    return;
  }

  // Sprint 13 : BTP Lead Unlock (mode=payment, pas subscription).
  // Route vers un handler dedie qui INSERT dans lead_unlocks.
  if (session.metadata?.product === "btp_lead_unlock") {
    await handleBtpLeadUnlock(session);
    return;
  }

  const stripe = getStripeServer();
  const supabase = await getServiceClient();

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!customerId || !subscriptionId) {
    console.warn("Webhook checkout: customer ou subscription manquant");
    return;
  }

  // Récupérer les détails de la subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (!subscription.items.data.length) {
    console.warn("Webhook checkout: subscription sans items", subscriptionId);
    return;
  }
  const firstItem = subscription.items.data[0];
  const priceId = firstItem.price.id;
  const { plan, product } = getPlanFromPriceId(priceId);

  await supabase
    .from("pros")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: "active",
      subscription_plan: plan,
      subscription_product: product, // 'btp' | 'ai' | null (Phase 8)
      current_period_end: firstItem
        ? new Date(firstItem.current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parseInt(proId));

  // Tracking (fire-and-forget)
  track(EVENTS.SUBSCRIPTION_COMPLETED, {
    proId: parseInt(proId),
    metadata: { plan, product, customerId },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = await getServiceClient();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price.id || "";
  const { plan, product } = getPlanFromPriceId(priceId);

  // Mapper le statut Stripe vers notre statut DB
  // Valeurs autorisées en DB : none, trialing, active, past_due, canceled, free, suspended
  let status: string;
  if (subscription.cancel_at_period_end) {
    status = "active"; // reste actif jusqu'à la fin de la période
  } else {
    switch (subscription.status) {
      case "active":
        status = "active";
        break;
      case "trialing":
        status = "trialing";
        break;
      case "past_due":
        status = "past_due";
        break;
      case "canceled":
      case "unpaid":
        status = "canceled";
        break;
      case "incomplete":
      case "incomplete_expired":
      case "paused":
        // Statuts Stripe non mappés → canceled pour éviter de violer la contrainte DB
        status = "canceled";
        break;
      default:
        console.warn(`Statut Stripe inconnu: ${subscription.status}, fallback canceled`);
        status = "canceled";
    }
  }

  // On ne reset PAS subscription_product si product === null (price ID inconnu).
  // On l'override seulement si on a pu le determiner (cas normal).
  const updateData: Record<string, unknown> = {
    subscription_status: status,
    subscription_plan: plan,
    current_period_end: firstItem
      ? new Date(firstItem.current_period_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };
  if (product !== null) updateData.subscription_product = product;

  await supabase
    .from("pros")
    .update(updateData)
    .eq("stripe_customer_id", customerId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = await getServiceClient();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  await supabase
    .from("pros")
    .update({
      subscription_status: "canceled",
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = await getServiceClient();
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  await supabase
    .from("pros")
    .update({
      subscription_status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  // Envoyer un email d'alerte au pro
  const { data: pro } = await supabase
    .from("pros")
    .select("email, name")
    .eq("stripe_customer_id", customerId)
    .single();

  if (pro?.email) {
    sendPaymentFailedEmail(pro.email, pro.name).catch((err) =>
      console.error("Erreur envoi email paiement échoué:", err)
    );
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const supabase = await getServiceClient();
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  // Récupérer la subscription depuis invoice.parent (Stripe v22)
  const subRef = invoice.parent?.subscription_details?.subscription;
  const subscriptionId =
    typeof subRef === "string" ? subRef : subRef?.id;

  const updateData: Record<string, unknown> = {
    subscription_status: "active",
    updated_at: new Date().toISOString(),
  };

  if (subscriptionId) {
    try {
      const stripe = getStripeServer();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const firstItem = subscription.items.data[0];
      if (firstItem) {
        updateData.current_period_end = new Date(
          firstItem.current_period_end * 1000
        ).toISOString();
      }
    } catch (err) {
      console.warn("Impossible de récupérer la subscription:", subscriptionId, err);
    }
  }

  await supabase
    .from("pros")
    .update(updateData)
    .eq("stripe_customer_id", customerId);
}

// ============================================
// Route POST — Webhook principal
// ============================================

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Signature manquante" },
      { status: 400 }
    );
  }

  const stripe = getStripeServer();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature invalide";
    console.error("Webhook signature invalide:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ============================================
  // Idempotence : skip si event deja traite
  // ============================================
  // Stripe peut retry un event jusqu'a 24h en cas de 5xx ou timeout.
  // Sans dedup, le meme event.id est traite N fois (double notification,
  // double trial activation, etc.). On INSERT le event.id dans
  // stripe_webhook_events ; si conflit (PRIMARY KEY violation), c'est
  // qu'on l'a deja vu → retour 200 OK immediat sans processing.
  const supabase = await getServiceClient();
  // Extraction defensive de pro_id depuis les metadata Stripe (utile pour
  // monitoring + jointure ulterieure, mais ne bloque pas si absent)
  let proIdFromMetadata: number | null = null;
  const eventObject = event.data.object as unknown as {
    metadata?: Record<string, string>;
  };
  if (eventObject.metadata?.pro_id) {
    const parsed = parseInt(String(eventObject.metadata.pro_id), 10);
    if (!isNaN(parsed)) proIdFromMetadata = parsed;
  }

  const { error: dedupError } = await supabase
    .from("stripe_webhook_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      api_version: event.api_version || null,
      event_created_at: new Date(event.created * 1000).toISOString(),
      pro_id: proIdFromMetadata,
    });

  if (dedupError) {
    // Code 23505 = duplicate key violation = event deja traite
    if (dedupError.code === "23505") {
      console.log(`[webhook] event ${event.id} (${event.type}) deja traite, skip`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Autre erreur : log mais on continue (mieux vaut traiter 2x que rater)
    console.error("[webhook] erreur insert stripe_webhook_events:", dedupError);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      default:
        // Événement non géré — on log sans crasher
        console.log(`Webhook Stripe non géré: ${event.type}`);
    }
  } catch (err) {
    console.error(`Erreur traitement webhook ${event.type}:`, err);
    // Mark l'event comme failed dans la table d'idempotence (pour monitoring)
    await supabase
      .from("stripe_webhook_events")
      .update({
        processing_error: err instanceof Error ? err.message.slice(0, 500) : "unknown",
      })
      .eq("stripe_event_id", event.id);
    // On retourne quand même 200 pour éviter les retries Stripe
    return NextResponse.json({ received: true, error: "processing_error" });
  }

  // Mark l'event comme traite avec succes (processed_at = NOW)
  await supabase
    .from("stripe_webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("stripe_event_id", event.id);

  return NextResponse.json({ received: true });
}
