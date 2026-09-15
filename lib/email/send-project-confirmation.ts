import { emailContent, renderEmail, escapeEmail, emailParagraph, emailDetails } from "@/lib/email/design";

import { Resend } from "resend";
import { buildGoogleReviewBlock } from "./google-review-block";

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
  "500_2000": "500 € à 2 000 €",
  "2000_5000": "2 000 € à 5 000 €",
  "5000_15000": "5 000 € à 15 000 €",
  gt15000: "Plus de 15 000 €",
};

export async function sendProjectConfirmation(
  data: ConfirmationEmailData
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";
  const urgencyLabel = URGENCY_LABELS[data.urgency] || data.urgency;
  // 28/08/2026 : budget retire du formulaire, les nouveaux projets valent
  // « unknown » et la ligne ne s'affiche plus (cf. broadcast-btp-project.ts).
  // Les anciens projets gardent la leur.
  const budgetLabel = BUDGET_LABELS[data.budget] ?? null;

  const html = renderEmail({
    title: "Votre projet est déposé.", subtitle: "Un premier pas de fait.", category: "Votre projet",
    preheader: `Votre demande ${data.categoryName} à ${data.cityName} a bien été reçue.`,
    body: emailParagraph(`Bonjour ${data.firstName}, nous avons bien reçu votre demande.`)
      + emailParagraph("Les professionnels intéressés pourront vous contacter si votre projet correspond à leur activité et à leur disponibilité. Vous restez libre de donner suite.")
      + emailDetails([
        ["Besoin", data.categoryName], ["Ville", data.cityName], ["Délai", urgencyLabel],
        ...(budgetLabel ? [["Budget", budgetLabel] as [string, unknown]] : []), ["Description", data.description],
      ])
      + emailParagraph("Votre besoin a changé ou vous avez trouvé une solution ? Vous pouvez retirer votre demande.")
      + (data.deletionToken ? `<p style="font-size:14px;line-height:1.7"><a style="color:#a63e18" href="${escapeEmail(`${escapeEmail(baseUrl)}/deposer-projet/supprimer?token=${encodeURIComponent(data.deletionToken)}`)}">Retirer ma demande</a></p>` : emailParagraph("Pour la retirer, répondez à cet email."))
      + emailParagraph("Les devis et les prestations se conviennent directement avec le professionnel.")
      + buildGoogleReviewBlock({ audience: "particulier" }),
  });

  try {
    await getResendClient().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: data.email,
      subject: "Votre demande a bien été reçue · Workwave",
      ...emailContent(html),
    });
  } catch (error) {
    console.error("Erreur envoi email confirmation particulier :", error);
    // Ne pas bloquer la soumission si l'email échoue
  }
}
