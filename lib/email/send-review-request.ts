import { emailContent, renderEmail, escapeEmail, emailParagraph, emailButton } from "@/lib/email/design";

import { Resend } from "resend";
import { generateReviewUnsubscribeToken } from "@/lib/utils/review-unsubscribe-token";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Mail de sollicitation d'avis envoye au particulier 7 jours apres le
 * depot de projet. Demande son retour sur l'experience avec le pro
 * contacte. Format court : 1 question, 1 CTA, 1 fallback contact.
 *
 * Vouvoiement strict. Design coherent avec les autres mails Workwave.
 */
export async function sendReviewRequest(params: {
  particulierEmail: string;
  particulierName: string;
  proName: string;
  proSlug: string;
  proCity: string | null;
  token: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr"
  ).replace(/\s+/g, "");

  const reviewUrl = `${baseUrl}/avis/${params.token}`;
  const proPageUrl = `${baseUrl}/artisan/${params.proSlug}`;
  const firstName = params.particulierName.split(/\s+/)[0] ?? "";
  const proCityLabel = params.proCity ? ` à ${params.proCity}` : "";

  // Lien de desinscription RGPD-safe (HMAC token deterministe sur l'email)
  const unsubToken = generateReviewUnsubscribeToken(params.particulierEmail);
  const unsubUrl = `${baseUrl}/unsubscribe-review?token=${unsubToken}&email=${encodeURIComponent(params.particulierEmail)}`;

  const html = renderEmail({
    title: "Votre expérience compte.", subtitle: "Racontez-la simplement.", category: "Votre avis",
    body: emailParagraph(`Bonjour${firstName ? ` ${firstName}` : ""}, avez-vous échangé avec ${params.proName}${proCityLabel} au sujet de votre projet ?`)
      + emailParagraph("Si oui, partagez votre expérience : ce qui vous a plu comme ce qui pourrait être amélioré. Votre retour aide les autres particuliers.")
      + emailButton("Partager mon expérience", reviewUrl)
      + emailParagraph("Choisissez une note de 1 à 5 étoiles. Le commentaire est facultatif. Votre avis est destiné à être public ; votre nom de famille n’est pas affiché en entier.")
      + `<p style="font-size:14px;line-height:1.7"><a style="color:#a63e18" href="${escapeEmail(proPageUrl)}">Consulter la fiche de ${escapeEmail(params.proName)}</a></p>`
      + emailParagraph("Vous n’avez pas échangé avec ce professionnel ? Ignorez cette invitation.")
      + `<p style="font-size:12px;line-height:1.7"><a style="color:#596670" href="${escapeEmail(unsubUrl)}">Ne plus recevoir de demandes d’avis</a></p>`,
  }).trim();

  try {
    const result = await getResendClient().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: params.particulierEmail,
      subject: `Comment s'est passé votre contact avec ${params.proName} ?`,
      ...emailContent(html),
      headers: {
        // Bloque le tracking pour respecter la simplicite du flow
        // (les emails de demande d'avis n'ont pas besoin d'analytics
        // Resend, on a deja le submitted_at en base pour mesurer).
        // List-Unsubscribe RFC 8058 : lien HTTPS + fallback mailto. Gmail
        // et Outlook affichent un bouton "Se désinscrire" direct dans
        // l'interface (UX et delivery boost).
        "List-Unsubscribe": `<${unsubUrl}>, <mailto:contact@workwave.fr?subject=Désinscription avis>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (result.error) {
      console.error("[review-request] Resend error :", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (e) {
    const err = e as Error;
    console.error("[review-request] Exception :", err.message);
    return { ok: false, error: err.message };
  }
}
