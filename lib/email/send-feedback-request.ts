import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/**
 * Email J+3 après dépôt de projet ou réclamation de fiche : invite à donner
 * un retour sur la plateforme via /feedback (agent SAV). Envoyé par le cron
 * /api/cron/feedback-relance, idempotent via feedback_request_sent_at.
 */
export async function sendFeedbackRequest(params: {
  email: string;
  audience: "particulier" | "pro";
}): Promise<void> {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr").replace(/\s+/g, "");
  const intro =
    params.audience === "pro"
      ? "Vous avez récemment activé votre fiche sur Workwave."
      : "Vous avez récemment déposé un projet sur Workwave.";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
    <p style="margin:0 0 16px;">Bonjour,</p>
    <p style="margin:0 0 16px;">${intro} Une question simple&nbsp;: <strong>qu'est-ce qu'on pourrait am&eacute;liorer&nbsp;?</strong></p>
    <p style="margin:0 0 16px;">Une id&eacute;e, un bug, quelque chose qui vous a agac&eacute; ou plu — dites-le en 2 minutes, c'est lu par l'&eacute;quipe et &ccedil;a fait vraiment avancer la plateforme.</p>
    <p style="margin:0 0 20px;"><a href="${baseUrl}/feedback" style="display:inline-block;background:#FF5A36;color:#fff;padding:12px 26px;border-radius:9999px;font-size:14px;font-weight:600;text-decoration:none;">Donner mon avis (2 min)</a></p>
    <p style="margin:0 0 4px;">Merci d'avance,</p>
    <p style="margin:0 0 24px;"><strong>L'&eacute;quipe Workwave</strong><br>
    <span style="color:#666;font-size:13px;"><a href="mailto:contact@workwave.fr" style="color:#666;">contact@workwave.fr</a> &middot; <a href="${baseUrl}" style="color:#666;">workwave.fr</a></span></p>
    <p style="margin:0;padding-top:14px;border-top:1px solid #eee;font-size:11px;color:#999;">Vous recevez cet email suite &agrave; votre activit&eacute; r&eacute;cente sur Workwave. Pour ne plus recevoir ce type de message, r&eacute;pondez STOP.</p>
  </div>
</body></html>`;

  await getResendClient().emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: params.email,
    subject:
      params.audience === "pro"
        ? "Une idée pour améliorer Workwave ? Dites-le nous"
        : "Votre avis sur Workwave nous intéresse (2 min)",
    html,
  });
}
