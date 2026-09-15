import { emailContent, renderEmail, emailParagraph, emailButton } from "@/lib/email/design";

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendPaymentFailedEmail(
  email: string,
  proName: string
): Promise<void> {
  const resend = getResendClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  await resend.emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: email,
    subject: "Problème de paiement · Workwave Pro",
    ...emailContent(renderEmail({
    title: "Un paiement à vérifier.", subtitle: "Retrouvons la situation.", category: "Votre compte",
    body: emailParagraph(`Bonjour ${proName}, une tentative de paiement liée à votre abonnement n’a pas abouti.`)
      + emailParagraph("Consultez votre espace pour vérifier le statut de votre abonnement et, si nécessaire, mettre à jour votre moyen de paiement.")
      + emailButton("Vérifier mon abonnement", `${baseUrl}/pro/dashboard/abonnement`)
      + emailParagraph("Vous avez déjà régularisé la situation ou vous avez une question ? Répondez à cet email."),
  })),
  });
}
