import { emailContent, renderEmail, emailParagraph } from "@/lib/email/design";

/**
 * Envoi d'une réponse de support à un client (particulier ou pro), depuis
 * l'admin. Le reply-to est contact@workwave.fr : la réponse du client repasse
 * par le webhook inbound et se rattache automatiquement au même ticket.
 */
import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type SupportReplyInput = {
  to: string;
  subject: string | null;
  body: string; // texte brut saisi par l'admin
};

export type SupportReplyResult = { ok: boolean; error?: string };

export async function sendSupportReply(
  input: SupportReplyInput
): Promise<SupportReplyResult> {

  const subject = input.subject?.trim()
    ? input.subject.trim().toLowerCase().startsWith("re:")
      ? input.subject.trim()
      : `Re: ${input.subject.trim()}`
    : "Votre demande · Workwave";

  // Corps : on préserve les sauts de ligne de l'admin.
  const bodyHtml = esc(input.body).replace(/\n/g, "<br>");

  const html = renderEmail({
    title: "Nous sommes là.", subtitle: "Reprenons votre demande.", category: "Support",
    preheader: "L’équipe Workwave a répondu à votre demande.",
    body: `<div style="font-size:16px;line-height:1.8;color:#53606a">${bodyHtml}</div>`
      + emailParagraph("Pour poursuivre la conversation, répondez directement à cet email.")
      + emailParagraph("L’équipe Workwave"),
  });

  const text = `${input.body}\n\n-\nL'équipe Workwave · workwave.fr\nRépondez directement à cet email, nous le recevons.`;

  try {
    const r = await getResend().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: [input.to],
      replyTo: "contact@workwave.fr",
      subject,
      ...emailContent(html),
      text,
    });
    if (r.error) return { ok: false, error: r.error.message || String(r.error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
