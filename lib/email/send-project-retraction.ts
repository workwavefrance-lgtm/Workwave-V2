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
    from: "Workwave <onboarding@resend.dev>",
    to: email,
    subject: `[Workwave] Projet retiré — ${categoryName} à ${cityName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #0A0A0A; margin-bottom: 16px;">
          Projet retiré par le demandeur
        </h1>
        <p style="font-size: 15px; color: #6B7280; line-height: 1.6; margin-bottom: 16px;">
          Bonjour ${proName},
        </p>
        <p style="font-size: 15px; color: #6B7280; line-height: 1.6; margin-bottom: 16px;">
          Le projet <strong>${categoryName}</strong> à <strong>${cityName}</strong> que vous avez
          reçu le ${formattedDate} a été retiré par le demandeur.
        </p>
        <p style="font-size: 15px; color: #6B7280; line-height: 1.6; margin-bottom: 24px;">
          Merci de ne pas contacter cette personne.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
        <p style="font-size: 12px; color: #9CA3AF;">
          Cet email a été envoyé automatiquement par Workwave.
        </p>
      </div>
    `,
  });
}
