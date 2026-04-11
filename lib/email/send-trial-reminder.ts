import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendTrialReminderEmail(
  email: string,
  proName: string
): Promise<void> {
  const resend = getResendClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  await resend.emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: email,
    subject: "Votre essai gratuit se termine demain — Workwave Pro",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #0A0A0A; margin-bottom: 16px;">
          Votre essai gratuit se termine demain
        </h1>
        <p style="font-size: 15px; color: #6B7280; line-height: 1.6; margin-bottom: 16px;">
          Bonjour ${proName},
        </p>
        <p style="font-size: 15px; color: #6B7280; line-height: 1.6; margin-bottom: 16px;">
          Votre période d'essai gratuit Workwave Pro se termine demain.
          Sans abonnement actif, vous ne recevrez plus les demandes de clients
          dans votre zone.
        </p>
        <p style="font-size: 15px; color: #6B7280; line-height: 1.6; margin-bottom: 24px;">
          Activez votre abonnement dès maintenant pour continuer à recevoir
          des leads qualifiés. À partir de 32,50 &euro;/mois avec l'offre annuelle.
        </p>
        <a href="${baseUrl}/pro/dashboard/abonnement"
           style="display: inline-block; background: #FF5A36; color: white; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 14px; font-weight: 600;">
          Activer mon abonnement
        </a>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
        <p style="font-size: 12px; color: #9CA3AF;">
          Cet email a été envoyé automatiquement par Workwave. Si vous pensez qu'il
          s'agit d'une erreur, contactez-nous à support@workwave.fr.
        </p>
      </div>
    `,
  });
}
