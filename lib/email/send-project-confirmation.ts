import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

type ConfirmationEmailData = {
  firstName: string;
  email: string;
  categoryName: string;
  cityName: string;
  description: string;
  urgency: string;
  budget: string;
  deletionToken?: string;
};

const URGENCY_LABELS: Record<string, string> = {
  today: "Aujourd'hui",
  this_week: "Cette semaine",
  this_month: "Ce mois-ci",
  not_urgent: "Pas pressé",
};

const BUDGET_LABELS: Record<string, string> = {
  lt500: "Moins de 500 €",
  "500_2000": "500 € – 2 000 €",
  "2000_5000": "2 000 € – 5 000 €",
  "5000_15000": "5 000 € – 15 000 €",
  gt15000: "Plus de 15 000 €",
  unknown: "Je ne sais pas",
};

export async function sendProjectConfirmation(
  data: ConfirmationEmailData
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";
  const urgencyLabel = URGENCY_LABELS[data.urgency] || data.urgency;
  const budgetLabel = BUDGET_LABELS[data.budget] || data.budget;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:#0A0A0A;padding:24px 32px;">
      <h1 style="margin:0;color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:-0.02em;">Workwave</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:16px;color:#0A0A0A;line-height:1.6;">
        Bonjour ${data.firstName},
      </p>
      <p style="margin:0 0 24px;font-size:16px;color:#0A0A0A;line-height:1.6;">
        Votre demande a bien été reçue. Nous la transmettons aux professionnels adaptés dans votre zone, qui vous contacteront très prochainement.
      </p>

      <!-- Récapitulatif -->
      <div style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;">Récapitulatif de votre demande</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;">
          <tr>
            <td style="padding:8px 0;color:#6B7280;width:120px;vertical-align:top;">Catégorie</td>
            <td style="padding:8px 0;color:#0A0A0A;font-weight:500;">${data.categoryName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6B7280;vertical-align:top;">Ville</td>
            <td style="padding:8px 0;color:#0A0A0A;font-weight:500;">${data.cityName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6B7280;vertical-align:top;">Urgence</td>
            <td style="padding:8px 0;color:#0A0A0A;font-weight:500;">${urgencyLabel}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6B7280;vertical-align:top;">Budget</td>
            <td style="padding:8px 0;color:#0A0A0A;font-weight:500;">${budgetLabel}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6B7280;vertical-align:top;">Description</td>
            <td style="padding:8px 0;color:#0A0A0A;">${data.description}</td>
          </tr>
        </table>
      </div>

      <!-- RGPD -->
      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#9A3412;line-height:1.6;">
          Si vous souhaitez annuler votre demande, ${data.deletionToken ? `<a href="${baseUrl}/deposer-projet/supprimer?token=${data.deletionToken}" style="color:#9A3412;font-weight:600;text-decoration:underline;">cliquez ici pour la supprimer</a>` : "répondez à cet email"}.
        </p>
      </div>

      <!-- Signature -->
      <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6;">
        À bientôt,<br>
        <span style="color:#0A0A0A;font-weight:500;">L'équipe Workwave</span>
      </p>
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px;background:#FAFAFA;border-top:1px solid #E5E7EB;text-align:center;">
      <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;">
        Workwave — Trouvez un professionnel de confiance près de chez vous
      </p>
      <p style="margin:0;color:#9CA3AF;font-size:11px;">
        Workwave est un simple intermédiaire d'information. Les devis, contrats et prestations sont de la responsabilité exclusive du professionnel et du particulier.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    await getResendClient().emails.send({
      from: "Workwave <onboarding@resend.dev>",
      to: data.email,
      subject: "Votre demande a bien été reçue — Workwave",
      html,
    });
  } catch (error) {
    console.error("Erreur envoi email confirmation particulier :", error);
    // Ne pas bloquer la soumission si l'email échoue
  }
}
