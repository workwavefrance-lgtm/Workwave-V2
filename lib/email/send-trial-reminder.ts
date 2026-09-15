import { emailContent, renderEmail, emailParagraph, emailButton } from "@/lib/email/design";

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Sprint 13. IMPORTANT : ce mail est USAGE WORKWAVE AI UNIQUEMENT.
 * BTP est pivote sur pay-per-lead (9,90 EUR/lead), plus d'essai/trialing
 * pour les BTP. Si un cron est cree pour appeler cette fonction, il DOIT
 * filtrer sur `category_id IN AI_CATEGORY_IDS` pour ne cibler que les
 * freelances AI Premium en essai 14j.
 *
 * Aujourd'hui (28/05/2026) aucun cron actif n'appelle cette fonction, mais
 * elle reste en place pour le jour ou on activera les reminders AI.
 */
export async function sendTrialReminderEmail(
  email: string,
  proName: string
): Promise<void> {
  const resend = getResendClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  await resend.emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: email,
    subject: "Votre essai gratuit se termine demain · Workwave AI",
    ...emailContent(renderEmail({
    title: "Votre essai se termine demain.", subtitle: "Choisissez la suite.", category: "Workwave AI",
    body: emailParagraph(`Bonjour ${proName}, votre période d’essai Workwave AI arrive à son terme demain.`)
      + emailParagraph("Consultez votre espace pour retrouver les conditions de votre offre et gérer votre abonnement.")
      + emailButton("Gérer mon abonnement", `${baseUrl}/pro/dashboard/abonnement`)
      + emailParagraph("Besoin d’aide pour comprendre votre offre ? Répondez à cet email."),
  })),
  });
}
