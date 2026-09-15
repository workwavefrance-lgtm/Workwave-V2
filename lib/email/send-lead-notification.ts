import { escapeEmail, emailContent, renderEmail, emailParagraph, emailButton, emailDetails } from "@/lib/email/design";

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
    today: "Urgent · aujourd'hui",
    this_week: "Cette semaine",
    this_month: "Ce mois-ci",
    not_urgent: "Pas urgent",
  };

  const budgetLabels: Record<string, string> = {
    lt500: "Moins de 500 \u20AC",
    "500_2000": "500 \u20AC \u00E0 2 000 \u20AC",
    "2000_5000": "2 000 \u20AC \u00E0 5 000 \u20AC",
    "5000_15000": "5 000 \u20AC \u00E0 15 000 \u20AC",
    gt15000: "Plus de 15 000 \u20AC",
    unknown: "Non pr\u00E9cis\u00E9",
  };

  await resend.emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: email,
    subject: `[Workwave] Nouveau projet · ${categoryName} à ${cityName}`,
    ...emailContent(renderEmail({ title: "Un nouveau projet.", subtitle: "Près de chez vous.", category: "Professionnels",
body: emailParagraph(`Bonjour ${proName}, une nouvelle demande est disponible dans votre zone.`)
 + emailDetails([["Métier", categoryName], ["Ville", cityName], ["Délai", urgencyLabels[urgency] || urgency], ...(budget !== "unknown" && budgetLabels[budget] ? [["Budget", budgetLabels[budget]] as [string, unknown]] : [])])
 + emailButton("Consulter le projet", `${baseUrl}/pro/dashboard/leads`)
 + emailParagraph("Vérifiez les informations et vos disponibilités avant de choisir de répondre. Le tarif et les éventuelles offres sont affichés dans votre espace avant le déblocage des coordonnées.")
 + `<p style="font-size:12px;line-height:1.7"><a style="color:#596670" href="${escapeEmail(`${baseUrl}/pro/dashboard/preferences`)}">Gérer mes notifications</a></p>` })),
  });
}
