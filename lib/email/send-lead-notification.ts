import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Envoie une notification de nouveau lead à un pro.
 */
export async function sendLeadNotificationEmail({
  email,
  proName,
  categoryName,
  cityName,
  urgency,
  budget,
  descriptionPreview,
}: {
  email: string;
  proName: string;
  categoryName: string;
  cityName: string;
  urgency: string;
  budget: string;
  descriptionPreview: string;
}): Promise<void> {
  const resend = getResendClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  const urgencyLabels: Record<string, string> = {
    today: "Urgent — aujourd'hui",
    this_week: "Cette semaine",
    this_month: "Ce mois-ci",
    not_urgent: "Pas urgent",
  };

  const budgetLabels: Record<string, string> = {
    lt500: "Moins de 500 \u20AC",
    "500_2000": "500 \u20AC \u2014 2 000 \u20AC",
    "2000_5000": "2 000 \u20AC \u2014 5 000 \u20AC",
    "5000_15000": "5 000 \u20AC \u2014 15 000 \u20AC",
    gt15000: "Plus de 15 000 \u20AC",
    unknown: "Non pr\u00E9cis\u00E9",
  };

  await resend.emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: email,
    subject: `[Workwave] Nouveau projet — ${categoryName} à ${cityName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #0A0A0A; margin-bottom: 16px;">
          Nouveau projet dans votre zone
        </h1>
        <p style="font-size: 15px; color: #6B7280; line-height: 1.6; margin-bottom: 16px;">
          Bonjour ${proName},
        </p>
        <p style="font-size: 15px; color: #6B7280; line-height: 1.6; margin-bottom: 24px;">
          Un nouveau projet correspond à vos critères. Voici les détails :
        </p>

        <div style="background: #FAFAFA; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #9CA3AF; width: 120px;">Catégorie</td>
              <td style="padding: 6px 0; font-size: 14px; color: #0A0A0A; font-weight: 500;">${categoryName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #9CA3AF;">Ville</td>
              <td style="padding: 6px 0; font-size: 14px; color: #0A0A0A; font-weight: 500;">${cityName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #9CA3AF;">Urgence</td>
              <td style="padding: 6px 0; font-size: 14px; color: #0A0A0A; font-weight: 500;">${urgencyLabels[urgency] || urgency}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #9CA3AF;">Budget</td>
              <td style="padding: 6px 0; font-size: 14px; color: #0A0A0A; font-weight: 500;">${budgetLabels[budget] || budget}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #6B7280; line-height: 1.6; margin-bottom: 24px; font-style: italic;">
          "${descriptionPreview}"
        </p>

        <a href="${baseUrl}/pro/dashboard/leads"
           style="display: inline-block; background: #FF5A36; color: white; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 14px; font-weight: 600;">
          Voir les détails
        </a>

        <p style="font-size: 13px; color: #9CA3AF; line-height: 1.6; margin-top: 24px;">
          Ce projet a été envoyé à 3 professionnels de votre zone. Soyez réactif pour maximiser vos chances.
        </p>

        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
        <p style="font-size: 12px; color: #9CA3AF; margin-bottom: 8px;">
          Cet email a été envoyé automatiquement par Workwave. Si vous pensez qu'il
          s'agit d'une erreur, contactez-nous à support@workwave.fr.
        </p>
        <p style="font-size: 11px; color: #9CA3AF;">
          Workwave est un simple intermédiaire d'information. Les devis, contrats et prestations sont de la responsabilité exclusive du professionnel et du particulier.
        </p>
      </div>
    `,
  });
}
