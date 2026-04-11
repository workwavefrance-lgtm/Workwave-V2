import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

type ImpersonationNoticeParams = {
  proEmail: string;
  proName: string;
  adminEmail: string;
  date: Date;
};

/**
 * Envoie un email de transparence au pro quand un admin accède à son compte.
 */
export async function sendImpersonationNotice({
  proEmail,
  proName,
  adminEmail,
  date,
}: ImpersonationNoticeParams) {
  const resend = getResendClient();
  const formattedDate = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  await resend.emails.send({
    from: "Workwave <noreply@workwave.fr>",
    to: proEmail,
    subject: "Un administrateur a accédé à votre compte",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #0A0A0A; margin-bottom: 16px;">
          Accès administrateur à votre compte
        </h2>
        <p style="font-size: 14px; color: #6B7280; line-height: 1.6; margin-bottom: 16px;">
          Bonjour ${proName},
        </p>
        <p style="font-size: 14px; color: #6B7280; line-height: 1.6; margin-bottom: 16px;">
          Un administrateur Workwave (<strong>${adminEmail}</strong>) s'est connecté à votre compte le <strong>${formattedDate}</strong> dans le cadre du support technique.
        </p>
        <p style="font-size: 14px; color: #6B7280; line-height: 1.6; margin-bottom: 16px;">
          Cette connexion est limitée à 30 minutes et est entièrement tracée dans nos logs. Aucune modification n'a été effectuée sans raison de support.
        </p>
        <p style="font-size: 14px; color: #6B7280; line-height: 1.6; margin-bottom: 24px;">
          Si vous n'avez pas sollicité d'assistance, merci de nous contacter à <a href="mailto:contact@workwave.fr" style="color: #FF5A36;">contact@workwave.fr</a>.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9CA3AF;">
          Cet email a été envoyé automatiquement par Workwave dans un souci de transparence.
        </p>
      </div>
    `,
  });
}
