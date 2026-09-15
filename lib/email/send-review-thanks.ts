import { emailContent, renderEmail, emailParagraph, emailButton, emailDetails } from "@/lib/email/design";

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Mail de remerciement envoye au particulier juste apres soumission
 * de son avis. Variant selon que l'avis est auto-publie (>= 3 etoiles)
 * ou en moderation (< 3 etoiles).
 *
 * Vouvoiement strict. Court (4-5 lignes). Pas de chichi.
 */
export async function sendReviewThanks(params: {
  particulierEmail: string;
  particulierName: string;
  proName: string;
  proSlug: string;
  rating: number;
  published: boolean; // true si auto-publie, false si en moderation
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr"
  ).replace(/\s+/g, "");

  const proUrl = `${baseUrl}/artisan/${params.proSlug}`;
  const firstName = params.particulierName.split(/\s+/)[0] ?? "";

  const subject = params.published
    ? `Merci ! Votre avis sur ${params.proName} est en ligne`
    : `Merci pour votre avis sur ${params.proName}`;

  const html = renderEmail({
    title: "Merci pour votre retour.", subtitle: params.published ? "Votre avis est en ligne." : "Votre avis a bien été reçu.", category: "Votre avis",
    body: emailParagraph(`Bonjour${firstName ? ` ${firstName}` : ""}, merci d’avoir partagé votre expérience avec ${params.proName}.`)
      + emailDetails([["Votre note", `${params.rating}/5`]])
      + (params.published ? emailButton("Voir mon avis", proUrl) : emailParagraph("Votre avis est en attente de vérification par notre équipe avant sa publication."))
      + emailParagraph("Votre retour aide les particuliers à mieux connaître les professionnels."),
  }).trim();

  try {
    const result = await getResendClient().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: params.particulierEmail,
      subject,
      ...emailContent(html),
    });
    if (result.error) {
      console.error("[review-thanks] Resend error :", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (e) {
    const err = e as Error;
    console.error("[review-thanks] Exception :", err.message);
    return { ok: false, error: err.message };
  }
}
