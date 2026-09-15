import { escapeEmail, emailContent, renderEmail } from "@/lib/email/design";

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
    ...emailContent(renderEmail({ title: "Un accès à votre compte.", subtitle: "En toute transparence.", category: "Compte", body: `
        <h2 style="font-size: 18px; font-weight: 600; color: #20282c; margin-bottom: 16px;">
          Accès administrateur à votre compte
        </h2>
        <p style="font-size: 14px; color: #53606a; line-height: 1.6; margin-bottom: 16px;">
          Bonjour ${escapeEmail(proName)},
        </p>
        <p style="font-size: 14px; color: #53606a; line-height: 1.6; margin-bottom: 16px;">
          Un administrateur Workwave (<strong>${escapeEmail(adminEmail)}</strong>) s'est connecté à votre compte le <strong>${escapeEmail(formattedDate)}</strong> dans le cadre du support technique.
        </p>
        <p style="font-size: 14px; color: #53606a; line-height: 1.6; margin-bottom: 16px;">
          Cette connexion est limitée à 30 minutes et est entièrement tracée dans nos logs. Aucune modification n'a été effectuée sans raison de support.
        </p>
        <p style="font-size: 14px; color: #53606a; line-height: 1.6; margin-bottom: 24px;">
          Si vous n'avez pas sollicité d'assistance, merci de nous contacter à <a href="mailto:contact@workwave.fr" style="color: #c64b1c;">contact@workwave.fr</a>.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
        <p style="font-size: 12px; color: #66727c;">
          Cet email a été envoyé automatiquement par Workwave dans un souci de transparence.
        </p>
      ` })),
  });
}
