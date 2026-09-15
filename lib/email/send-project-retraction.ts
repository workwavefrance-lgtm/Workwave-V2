import { escapeEmail, emailContent, renderEmail } from "@/lib/email/design";

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Envoie un email de rétractation à un pro quand un particulier supprime son projet.
 */
export async function sendProjectRetractionEmail({
  email,
  proName,
  categoryName,
  cityName,
  sentDate,
}: {
  email: string;
  proName: string;
  categoryName: string;
  cityName: string;
  sentDate: string;
}): Promise<void> {
  const resend = getResendClient();

  const formattedDate = new Date(sentDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  await resend.emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: email,
    subject: `[Workwave] Projet retiré · ${categoryName} à ${cityName}`,
    ...emailContent(renderEmail({ title: "La demande a été retirée.", subtitle: "Vous êtes informé.", category: "Professionnels", body: `

        <p style="font-size: 15px; color: #53606a; line-height: 1.6; margin-bottom: 16px;">
          Bonjour ${escapeEmail(proName)},
        </p>
        <p style="font-size: 15px; color: #53606a; line-height: 1.6; margin-bottom: 16px;">
          Le projet <strong>${escapeEmail(categoryName)}</strong> à <strong>${escapeEmail(cityName)}</strong> que vous avez
          reçu le ${escapeEmail(formattedDate)} a été retiré par le demandeur.
        </p>
        <p style="font-size: 15px; color: #53606a; line-height: 1.6; margin-bottom: 24px;">
          Merci de ne pas contacter cette personne.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;">
        <p style="font-size: 12px; color: #66727c;">
          Cet email a été envoyé automatiquement par Workwave.
        </p>
      ` })),
  });
}
