import { emailContent, renderEmail, emailParagraph, emailButton } from "@/lib/email/design";

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
  const html = renderEmail({
    title: "Votre expérience nous aide.", subtitle: "Qu’est-ce qui vous manque ?", category: "Votre retour",
    body: emailParagraph(`${intro} Qu’est-ce qui vous a été utile, ou vous a compliqué la tâche ?`)
      + emailParagraph("Une idée, une difficulté ou une suggestion : votre message sera lu par l’équipe.")
      + emailButton("Partager mon retour", `${baseUrl}/feedback`)
      + emailParagraph("Vous pouvez aussi répondre directement à cet email.")
      + `<p style="font-size:12px;color:#66727c;line-height:1.7">Vous recevez cette invitation à la suite de votre activité sur Workwave. Pour ne plus recevoir ce type de message, répondez STOP.</p>`,
  });

  await getResendClient().emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: params.email,
    subject:
      params.audience === "pro"
        ? "Une idée pour améliorer Workwave ? Dites-le nous"
        : "Comment s’est passé votre dépôt sur Workwave ?",
    ...emailContent(html),
  });
}
