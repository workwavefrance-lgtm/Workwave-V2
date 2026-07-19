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
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr")
    .replace(/\s+/g, "")
    .replace(/\/+$/, "");
  const subject = input.subject?.trim()
    ? input.subject.trim().toLowerCase().startsWith("re:")
      ? input.subject.trim()
      : `Re: ${input.subject.trim()}`
    : "Votre demande — Workwave";

  // Corps : on préserve les sauts de ligne de l'admin.
  const bodyHtml = esc(input.body).replace(/\n/g, "<br>");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F7F7F7;margin:0;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <p style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#999;letter-spacing:0.2em;margin:0 0 20px 0;">[ WORKWAVE &middot; SUPPORT ]</p>
    <div style="font-size:15px;color:#0A0A0A;line-height:1.7;">${bodyHtml}</div>
    <hr style="border:none;border-top:1px solid #E5E5E5;margin:28px 0 16px 0;">
    <p style="font-size:12px;color:#999;line-height:1.6;margin:0;">
      L'équipe Workwave &middot; <a href="${baseUrl}" style="color:#999;">workwave.fr</a><br>
      Répondez directement à cet email, nous le recevons.
    </p>
  </div>
</body></html>`;

  const text = `${input.body}\n\n—\nL'équipe Workwave · workwave.fr\nRépondez directement à cet email, nous le recevons.`;

  try {
    const r = await getResend().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: [input.to],
      replyTo: "contact@workwave.fr",
      subject,
      html,
      text,
    });
    if (r.error) return { ok: false, error: r.error.message || String(r.error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
