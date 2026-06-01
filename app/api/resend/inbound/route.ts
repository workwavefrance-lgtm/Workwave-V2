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
    console.error("[resend-inbound] RESEND_WEBHOOK_SECRET manquant — non vérifiable, skip");
    return NextResponse.json({ ok: false, error: "secret_missing" });
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

  // Anti-boucle : ne jamais re-transférer nos propres envois
  if (/noreply@workwave\.fr|contact@workwave\.fr/i.test(event.data.from || "")) {
    return NextResponse.json({ ok: true, skipped: "self_sender" });
  }
  if (!adminEmail) {
    console.error("[resend-inbound] ADMIN_EMAIL manquant");
    return NextResponse.json({ ok: false, error: "admin_email_missing" });
  }

  // 3. Récupère le corps complet du mail reçu
  const { data: mail, error } = await resend.emails.receiving.get(emailId);
  if (error || !mail) {
    console.error("[resend-inbound] receiving.get échec", error);
    return NextResponse.json({ ok: false, error: "fetch_failed" });
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

  // 4. Transfert vers la boîte admin (reply-to = expéditeur d'origine)
  const sent = await resend.emails.send({
    from: "Workwave Inbox <noreply@workwave.fr>",
    to: adminEmail,
    replyTo: from,
    subject: `📩 ${subject} — via contact@workwave.fr`,
    html: headerHtml + bodyHtml,
    text: textPlain,
  });

  if (sent.error) {
    console.error("[resend-inbound] forward send échec", sent.error);
    return NextResponse.json({ ok: false, error: "forward_failed" });
  }

  return NextResponse.json({ ok: true, forwarded: emailId });
}
