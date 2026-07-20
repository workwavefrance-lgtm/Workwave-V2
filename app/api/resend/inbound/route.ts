/**
 * Webhook Resend "email.received" → transfère chaque email entrant reçu sur
 * contact@workwave.fr vers la vraie boîte admin (ADMIN_EMAIL), avec reply-to =
 * l'expéditeur d'origine (donc on répond normalement depuis Gmail).
 *
 * POURQUOI : le MX de workwave.fr pointe vers Resend (réception), donc les mails
 * entrants atterrissaient dans le dashboard Resend et JAMAIS dans la boîte de
 * l'admin → "zéro mail, aucune réponse" alors que des gens écrivaient vraiment
 * (RGPD, réponses partenaires…). Ce webhook rétablit la visibilité.
 *
 * SETUP (à faire une fois côté Resend) :
 *   1. Resend → Webhooks → Add Webhook
 *   2. Endpoint : https://workwave.fr/api/resend/inbound
 *   3. Event : email.received
 *   4. Copier le "Signing Secret" (whsec_…) → l'ajouter en env Vercel :
 *        RESEND_WEBHOOK_SECRET=whsec_xxx   (production)
 *
 * Sécurité : signature svix vérifiée (resend.webhooks.verify). Anti-boucle :
 * on ne re-transfère pas nos propres envois (noreply@/contact@workwave.fr).
 *
 * NB : les pièces jointes ne sont pas re-jointes en v1 (leurs noms sont listés ;
 * le contenu reste consultable dans le dashboard Resend).
 */
import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  ingestInboundEmailAsTicket,
  markTicketAdminNotified,
  parseEmailFrom,
  updateTicketTriage,
} from "@/lib/support/tickets";
import { checkInboundRateLimit } from "@/lib/support/rate-limit";
import { triageTicket } from "@/lib/support/triage";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const resend = new Resend(process.env.RESEND_API_KEY);

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    info: "Webhook Resend (event email.received). À configurer dans Resend → Webhooks.",
  });
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const adminEmail = process.env.ADMIN_EMAIL;
  const rawBody = await req.text();

  if (!secret) {
    // Erreur de config : 500 pour que l'échec soit visible et rejoué une fois le
    // secret ajouté (un 200 ferait considérer l'événement "livré" = perdu).
    console.error("[resend-inbound] RESEND_WEBHOOK_SECRET manquant");
    return NextResponse.json({ ok: false, error: "secret_missing" }, { status: 500 });
  }

  // 1. Vérification de la signature svix (Resend) — headers = en-têtes svix
  let event;
  try {
    event = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: req.headers.get("svix-id") || "",
        timestamp: req.headers.get("svix-timestamp") || "",
        signature: req.headers.get("svix-signature") || "",
      },
      webhookSecret: secret,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  // 2. On ne traite que les emails ENTRANTS
  if (event.type !== "email.received") {
    return NextResponse.json({ ok: true, skipped: event.type });
  }

  const emailId = event.data.email_id;

  // Anti-boucle : ne jamais re-transférer ni transformer en ticket nos propres
  // envois — NI les réponses de l'admin lui-même.
  //
  // POURQUOI ADMIN_EMAIL : le forward arrive dans la boîte Gmail de l'admin,
  // qui y répond directement (c'est le mode d'emploi affiché dans le mail).
  // Si cette réponse repasse par contact@workwave.fr — ce qui arrive dès que
  // l'interlocuteur a une adresse @workwave.fr, ou sur un simple "répondre à
  // tous" — elle crée un ticket où l'ADMIN figure comme demandeur, trié et
  // priorisé par l'IA. Constaté en conditions réelles le 20/07/2026 : la
  // réponse de l'admin a généré le ticket #25 "unlock / urgent".
  const senderEmail = parseEmailFrom(event.data.from || "").email;
  const adminEmailNormalized = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const isSelfSender =
    /noreply@workwave\.fr|contact@workwave\.fr/i.test(event.data.from || "") ||
    (adminEmailNormalized.length > 0 && senderEmail === adminEmailNormalized);
  if (isSelfSender) {
    return NextResponse.json({ ok: true, skipped: "self_sender" });
  }

  // 2 bis. Limite de débit — AVANT le receiving.get, donc avant toute dépense
  // (appel Resend, requêtes de contexte, tri IA, forward). On répond 200 : un
  // 5xx ferait rejouer l'événement par svix en boucle et amplifierait le flot.
  const rate = await checkInboundRateLimit(senderEmail);
  if (!rate.allowed) {
    console.error(`[resend-inbound] débit dépassé (${rate.reason}) — ${rate.detail}`);
    return NextResponse.json({ ok: true, skipped: "rate_limited", reason: rate.reason });
  }

  // 3. Récupère le corps complet du mail reçu
  const { data: mail, error } = await resend.emails.receiving.get(emailId);
  if (error || !mail) {
    // Échec transitoire (timeout/5xx Resend) -> 502 pour DÉCLENCHER le retry svix
    // (sinon un 200 = "livré" = email perdu à jamais).
    console.error("[resend-inbound] receiving.get échec", error);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 502 });
  }

  const from = mail.from || event.data.from || "(expéditeur inconnu)";
  const subject = mail.subject || event.data.subject || "(sans objet)";
  const atts = mail.attachments || [];
  const attLine = atts.length
    ? `<b>Pièces jointes :</b> ${atts
        .map((a) => esc(a.filename || "pièce jointe"))
        .join(", ")} <span style="color:#9CA3AF">(non re-jointes — visibles dans Resend)</span><br>`
    : "";

  const headerHtml = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:14px 18px;margin-bottom:18px;font-size:13px;color:#374151;line-height:1.6">
      <div style="font-weight:700;color:#0A0A0A;margin-bottom:6px">📩 Email reçu sur contact@workwave.fr</div>
      <b>De :</b> ${esc(from)}<br>
      <b>Objet :</b> ${esc(subject)}<br>
      ${attLine}
      <span style="color:#6B7280">↩︎ Réponds directement à cet email : ta réponse part vers l'expéditeur d'origine.</span>
    </div>`;

  const bodyHtml = mail.html
    ? mail.html
    : mail.text
      ? `<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;color:#0A0A0A">${esc(mail.text)}</pre>`
      : "<i>(corps vide)</i>";

  const textPlain = `📩 Email reçu sur contact@workwave.fr
De : ${from}
Objet : ${subject}${atts.length ? `\nPièces jointes : ${atts.map((a) => a.filename || "pièce jointe").join(", ")}` : ""}
(Réponds directement : ta réponse part vers l'expéditeur d'origine.)
----------------------------------------

${mail.text || "(corps en HTML uniquement — voir la version HTML)"}`;

  // 4. Support maison : l'email devient un TICKET, AVANT le forward, pour ne pas
  //    dépendre d'un seul canal. Best-effort (un échec ici ne casse rien) et
  //    idempotent (email_id Resend) -> un éventuel rejeu svix ne duplique pas.
  let ticketId: number | null = null;
  try {
    const ticket = await ingestInboundEmailAsTicket({
      resendEmailId: emailId,
      fromRaw: from,
      subject,
      text: mail.text ?? null,
      html: mail.html ?? null,
    });
    if (ticket) {
      // On retient l'id DÈS QU'un ticket existe, même sur un doublon : si un
      // premier essai a créé le ticket puis échoué au forward, le rejeu svix
      // repasse ici en "duplicate" et c'est CE passage-là qui réussit l'envoi.
      // Ne pas l'assigner laisserait admin_notified_at vide à vie, donc un
      // ticket signalé "jamais notifié" alors que l'admin a bien reçu le mail.
      ticketId = ticket.ticketId;
      // Tri IA (catégorie / urgence / flag légal) : UNIQUEMENT à la création
      // d'un ticket, best-effort et borné en coût (Haiku, corps tronqué).
      // Un échec ici n'a aucun effet sur le ticket ni sur le forward.
      if (ticket.created) {
        try {
          const triage = await triageTicket({
            subject,
            body: mail.text || mail.html || "",
          });
          if (triage) await updateTicketTriage(ticket.ticketId, triage);
        } catch (e) {
          console.error("[resend-inbound] tri IA échec:", (e as Error).message);
        }
      }
    }
  } catch (e) {
    console.error("[resend-inbound] ingestion ticket échec:", (e as Error).message);
  }

  // 5. Transfert vers la boîte admin (le filet Gmail, reply-to = expéditeur).
  if (!adminEmail) {
    // Config manquante : 500 -> échec visible et rejoué (le ticket est déjà créé).
    console.error("[resend-inbound] ADMIN_EMAIL manquant");
    return NextResponse.json(
      { ok: false, error: "admin_email_missing", ticketId },
      { status: 500 }
    );
  }
  const sent = await resend.emails.send({
    from: "Workwave Inbox <noreply@workwave.fr>",
    to: adminEmail,
    replyTo: from,
    subject: `📩 ${subject} — via contact@workwave.fr`,
    html: headerHtml + bodyHtml,
    text: textPlain,
  });
  if (sent.error) {
    // Échec transitoire -> 502 pour rejeu svix (le ticket est déjà créé, l'ingest
    // est idempotent au rejeu). Sans 502, l'admin ne verrait jamais ce mail.
    console.error("[resend-inbound] forward send échec", sent.error);
    return NextResponse.json(
      { ok: false, error: "forward_failed", ticketId },
      { status: 502 }
    );
  }

  // 6. Forward réussi = notification admin -> on trace (audit-trail).
  if (ticketId) {
    try {
      await markTicketAdminNotified(ticketId);
    } catch {
      /* best-effort */
    }
  }

  return NextResponse.json({ ok: true, forwarded: emailId, ticketId });
}
