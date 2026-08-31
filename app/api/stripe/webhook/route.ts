import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeServer } from "@/lib/stripe/server";
import { sendPaymentFailedEmail } from "@/lib/email/send-payment-failed";
import { sendPaidUnlockAlert } from "@/lib/email/send-paid-unlock-alert";
import { track } from "@/lib/analytics/track";
import { EVENTS } from "@/lib/analytics/events";
import { getServiceClient } from "@/lib/supabase/service-client";

/**
 * Erreur qui doit faire REESSAYER Stripe.
 *
 * Par defaut ce webhook renvoie 200 sur toute erreur de traitement, pour ne pas
 * declencher de tempete de reprises sur un bug applicatif. C'est le bon choix
 * pour la plupart des evenements, mais PAS quand de l'argent a ete encaisse et
 * que la contrepartie n'a pas ete livree. Dans ce cas precis on veut que Stripe
 * revienne (il reessaie avec un delai croissant pendant 3 jours), parce que le
 * traitement est idempotent : un doublon est deja rattrape par la contrainte
 * UNIQUE (project_id, pro_id) -> code 23505 -> succes silencieux.
 */
class StripeRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeRetryableError";
  }
}

// Supabase service client (pas de cookies dans un webhook)

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
 * Sprint 13 · BTP Lead Unlock.
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
    // ── ARGENT ENCAISSE, CONTREPARTIE NON LIVREE ──────────────────────────
    // Avant le 08/08/2026 : `console.error` puis `return`. La fonction sortait
    // NORMALEMENT, donc le catch de l'appelant n'etait jamais atteint, l'event
    // etait marque `processed_at` (= "traite avec succes") et Stripe recevait
    // 200. Resultat : le pro a paye 9,90 EUR, la ligne lead_unlocks n'existe
    // pas, ses coordonnees restent verrouillees, Stripe ne reessaie jamais, et
    // la base affirme que tout s'est bien passe. Personne n'est au courant.
    //
    // On leve donc une erreur "a reessayer" : l'appelant renverra 500, Stripe
    // rejouera l'evenement (delai croissant, jusqu'a 3 jours) et le traitement
    // est idempotent (23505 ci-dessus). En parallele l'admin est prevenu tout
    // de suite, pour pouvoir debloquer a la main sans attendre.
    throw new StripeRetryableError(
      `INSERT lead_unlocks echoue (${insertError.code}: ${insertError.message}) : ` +
        `pro ${proId}, projet ${projectId}, paiement ${paymentIntentId}, ` +
        `${(session.amount_total || 990) / 100} EUR encaisses SANS deblocage`
    );
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

  // Notif admin (leçon 28/04 : tout événement business critique = notif admin
  // dans le même flux). Best-effort strict : un échec d'email ne casse JAMAIS
  // le webhook : l'unlock est déjà inséré, l'idempotence protège les replays.
  try {
    const { data: pro } = await supabase
      .from("pros")
      .select("name")
      .eq("id", proId)
      .single();
    const { data: proj } = await supabase
      .from("projects")
      .select("cities(name), categories(name)")
      .eq("id", projectId)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pj = proj as any;
    const city = Array.isArray(pj?.cities) ? pj.cities[0]?.name : pj?.cities?.name;
    const category = Array.isArray(pj?.categories)
      ? pj.categories[0]?.name
      : pj?.categories?.name;
    await sendPaidUnlockAlert({
      proId,
      proName: pro?.name || `#${proId}`,
      projectId,
      amountCents: session.amount_total || 990,
      city: city ?? null,
      category: category ?? null,
    });
  } catch (e) {
    console.error("[handleBtpLeadUnlock] admin alert failed:", e);
  }

  console.log(
    `[handleBtpLeadUnlock] OK : pro ${proId} a unlock le projet ${projectId} (${(session.amount_total || 990) / 100}€)`
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
// Route POST · Webhook principal
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
  // Idempotence : skip si event deja TRAITE (pas seulement deja recu)
  // ============================================
  // Stripe peut retry un event jusqu'a 24h en cas de 5xx ou timeout.
  // Sans dedup, le meme event.id est traite N fois (double notification,
  // double trial activation, etc.). On INSERT le event.id dans
  // stripe_webhook_events ; si conflit (PRIMARY KEY violation), c'est
  // qu'on l'a deja recu, et on relit la ligne pour savoir si la tentative
  // precedente est allee au bout (cf. bloc `if (dedupError)` plus bas).
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
    // Code 23505 = duplicate key violation = event deja RECU. Attention :
    // "deja recu" ne veut pas dire "deja traite".
    if (dedupError.code === "23505") {
      // ── POURQUOI CE BLOC EST PLUS COMPLIQUE QU'UN SIMPLE SKIP ────────────
      // Avant le 31/08/2026 on renvoyait 200 ici, sans rien relire. Le rejeu
      // Stripe declenche par un `StripeRetryableError` (paiement encaisse mais
      // INSERT lead_unlocks echoue, cf. handleBtpLeadUnlock) etait donc bloque
      // ICI, avant meme d'atteindre le handler : la ligne existait deja dans
      // stripe_webhook_events depuis la 1re tentative, celle qui avait echoue.
      // Resultat : le pro avait paye 9,90 EUR, la ligne lead_unlocks n'existait
      // pas, et le mecanisme de rattrapage automatique ne pouvait JAMAIS
      // aboutir. Seule une reparation manuelle sortait le pro de la, sur la
      // seule source de revenus du site.
      //
      // On distingue donc les deux cas via `processed_at` :
      //   - renseigne  : l'event est alle au bout, vrai doublon, on skip.
      //     C'est CE test qui protege des effets de bord joues deux fois.
      //   - NULL       : la tentative precedente n'a pas abouti, on laisse le
      //     rejeu retraiter. Sans risque de double facturation : ce webhook
      //     n'encaisse rien (Stripe a deja debite), il ENREGISTRE. Et les
      //     handlers sont idempotents : UPDATE par cle pour les abonnements,
      //     INSERT lead_unlocks protege par UNIQUE (project_id, pro_id) qui
      //     retombe sur un 23505 traite en skip silencieux.
      const { data: dejaVu, error: relectureError } = await supabase
        .from("stripe_webhook_events")
        .select("processed_at, processing_error, received_at")
        .eq("stripe_event_id", event.id)
        .maybeSingle();

      if (dejaVu?.processed_at) {
        console.log(`[webhook] event ${event.id} (${event.type}) deja traite, skip`);
        return NextResponse.json({ received: true, duplicate: true });
      }

      // La tentative precedente n'a pas abouti. Reste a savoir si elle est
      // TERMINEE ou encore EN COURS : Stripe peut livrer deux fois le meme
      // event quasi simultanement, et retraiter en parallele rejouerait des
      // effets de bord non proteges par une contrainte SQL (mail "paiement
      // echoue" envoye deux fois au pro, par exemple).
      // Elle est consideree terminee si elle a laisse une erreur, ou si elle
      // est trop vieille pour tourner encore : Stripe coupe sa requete a 30 s,
      // les 120 s ci-dessous laissent une marge large. Les rejeux Stripe
      // arrivent a plusieurs minutes d'intervalle, donc le rattrapage passe
      // toujours ce test ; seules les livraisons vraiment concurrentes sont
      // arretees ici.
      const DELAI_TENTATIVE_EN_COURS_MS = 120_000;
      const recuLeMs = dejaVu?.received_at
        ? new Date(dejaVu.received_at).getTime()
        : 0;
      const tentativeEncoreEnCours =
        !relectureError &&
        dejaVu != null &&
        !dejaVu.processing_error &&
        Date.now() - recuLeMs < DELAI_TENTATIVE_EN_COURS_MS;

      if (tentativeEncoreEnCours) {
        console.log(
          `[webhook] event ${event.id} (${event.type}) deja en cours de traitement, skip`
        );
        return NextResponse.json({ received: true, duplicate: true });
      }

      // Si la relecture elle-meme a echoue (`relectureError`, ou ligne
      // introuvable), on retraite : ne pas livrer un deblocage paye coute plus
      // cher que de rejouer un handler idempotent.
      console.warn(
        `[webhook] event ${event.id} (${event.type}) deja recu mais jamais abouti` +
          `${relectureError ? " (relecture KO)" : ""}, rattrapage du traitement`
      );
      // Pas de `return` : on tombe volontairement dans le switch ci-dessous.
    } else {
      // Autre erreur : log mais on continue (mieux vaut traiter 2x que rater)
      console.error("[webhook] erreur insert stripe_webhook_events:", dedupError);
    }
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
        // Événement non géré : on log sans crasher
        console.log(`Webhook Stripe non géré: ${event.type}`);
    }
  } catch (err) {
    console.error(`Erreur traitement webhook ${event.type}:`, err);
    const message = err instanceof Error ? err.message : "unknown";
    // Mark l'event comme failed dans la table d'idempotence (pour monitoring).
    // `processed_at` reste NULL : l'event n'est PAS considéré comme traité.
    await supabase
      .from("stripe_webhook_events")
      .update({ processing_error: message.slice(0, 500) })
      .eq("stripe_event_id", event.id);

    // Cas "argent encaissé sans contrepartie" : on prévient l'admin tout de
    // suite (il peut débloquer à la main) ET on renvoie 500 pour que Stripe
    // rejoue l'événement. Le traitement est idempotent, un rejeu est sans
    // risque. Pour toute autre erreur on conserve le 200 historique, qui
    // évite les tempêtes de reprises sur un bug applicatif.
    if (err instanceof StripeRetryableError) {
      try {
        const { Resend } = await import("resend");
        await new Resend(process.env.RESEND_API_KEY).emails.send({
          from: "Workwave <contact@workwave.fr>",
          to: process.env.ADMIN_EMAIL || "workwave.france@gmail.com",
          subject: "[Workwave] PAIEMENT ENCAISSE SANS DEBLOCAGE · action requise",
          html: `<div style="font-family:sans-serif;max-width:560px;padding:24px">
            <h2 style="color:#0A0A0A">Un pro a payé, le déblocage n'a pas été enregistré</h2>
            <p>L'écriture dans <code>lead_unlocks</code> a échoué. Stripe va rejouer
            l'événement automatiquement, mais vérifie que le pro obtient bien ses
            coordonnées, sinon débloque-le à la main.</p>
            <p><strong>Événement Stripe :</strong> ${event.id}</p>
            <p><strong>Détail :</strong> ${message}</p>
          </div>`,
        });
      } catch (mailErr) {
        console.error("[webhook] alerte admin paiement non livré KO:", mailErr);
      }
      return NextResponse.json(
        { received: false, error: "unlock_not_persisted" },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true, error: "processing_error" });
  }

  // Mark l'event comme traite avec succes (processed_at = NOW).
  // `processing_error` est remis a NULL : depuis que le rejeu Stripe peut
  // rattraper une tentative ratee (cf. bloc 23505 plus haut), une ligne peut
  // porter l'erreur d'un essai precedent alors que l'event a fini par aboutir.
  // Or `scripts/verif-invariants.ts` compte TOUTE ligne avec un
  // `processing_error` comme "erreur non resolue" : sans ce reset, chaque
  // rattrapage reussi laisserait une alerte permanente, donc une alerte qu'on
  // finit par ignorer. La trace de l'incident reste dans les logs et dans le
  // mail d'alerte deja envoye a l'admin.
  // L'erreur de cet UPDATE est LUE, et pas seulement par principe. Corrige le
  // 01/09/2026 : sans ce controle, un echec ici (coupure reseau, delai depasse)
  // laissait la ligne avec `processed_at` a NULL alors que le traitement avait
  // REUSSI, pendant que la route repondait 200 a Stripe. Stripe ne rejoue pas un
  // evenement acquitte : la ligne restait donc indefiniment "en cours" et
  // `verif-invariants.ts` la signalait sans que personne ne puisse rien y faire.
  // Un paiement livre mais jamais marque comme tel est exactement le genre
  // d'incoherence qui fait perdre du temps a chaque audit suivant.
  const { error: erreurMarquage } = await supabase
    .from("stripe_webhook_events")
    .update({ processed_at: new Date().toISOString(), processing_error: null })
    .eq("stripe_event_id", event.id);

  if (erreurMarquage) {
    // On NE renvoie PAS d'erreur a Stripe : le travail metier est fait, le rejeu
    // ne servirait a rien et risquerait une double livraison. On trace, c'est
    // tout.
    console.error(
      `[stripe] evenement ${event.id} traite mais non marque en base : ${erreurMarquage.message}`,
    );
  }

  return NextResponse.json({ received: true });
}
