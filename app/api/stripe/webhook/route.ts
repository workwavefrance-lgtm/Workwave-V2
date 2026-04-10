import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeServer } from "@/lib/stripe/server";
import { sendPaymentFailedEmail } from "@/lib/email/send-payment-failed";

// Supabase service client (pas de cookies dans un webhook)
async function getServiceClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Déterminer le plan à partir du price ID
function getPlanFromPriceId(priceId: string): "monthly" | "annual" | null {
  if (priceId === process.env.STRIPE_PRICE_MONTHLY_ID) return "monthly";
  if (priceId === process.env.STRIPE_PRICE_ANNUAL_ID) return "annual";
  return null;
}

// ============================================
// Handlers par événement
// ============================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const proId = session.metadata?.pro_id;
  if (!proId) {
    console.warn("Webhook checkout.session.completed sans pro_id dans metadata");
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
  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price.id || "";
  const plan = getPlanFromPriceId(priceId);

  await supabase
    .from("pros")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: "active",
      subscription_plan: plan,
      current_period_end: firstItem
        ? new Date(firstItem.current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parseInt(proId));
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = await getServiceClient();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price.id || "";
  const plan = getPlanFromPriceId(priceId);

  // Mapper le statut Stripe vers notre statut
  let status: string;
  if (subscription.cancel_at_period_end) {
    // L'abonnement est programmé pour être annulé
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
      default:
        status = subscription.status;
    }
  }

  await supabase
    .from("pros")
    .update({
      subscription_status: status,
      subscription_plan: plan,
      current_period_end: firstItem
        ? new Date(firstItem.current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
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
    const stripe = getStripeServer();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const firstItem = subscription.items.data[0];
    if (firstItem) {
      updateData.current_period_end = new Date(
        firstItem.current_period_end * 1000
      ).toISOString();
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
    // On retourne quand même 200 pour éviter les retries Stripe
    return NextResponse.json({ received: true, error: "processing_error" });
  }

  return NextResponse.json({ received: true });
}
