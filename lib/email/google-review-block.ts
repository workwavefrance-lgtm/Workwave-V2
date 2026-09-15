/**
 * Bloc "Laissez un avis Google" réutilisable dans les emails transactionnels.
 *
 * Lien officiel de la fiche Google Business "Workwave" (3 Rue des Rosiers,
 * 86110 Craon, fiche validée, récupéré depuis business.google.com le
 * 12/06/2026). Le lien ouvre directement le formulaire d'avis Google.
 *
 * Stratégie : Trustpilot est payant, les avis Google sont gratuits et
 * boostent la fiche GBP + la confiance (rich snippets). On demande l'avis
 * aux deux moments où l'utilisateur vient de vivre le produit :
 *  - particulier : juste après le dépôt de projet (send-project-confirmation)
 *  - pro : juste après la réclamation de sa fiche (send-claim-welcome)
 * Conforme aux règles Google : on demande à TOUS (pas de review gating),
 * sans incitation/récompense.
 */
export const GOOGLE_REVIEW_URL = "https://g.page/r/CTOGdKur57CKEBM/review";

export function buildGoogleReviewBlock(opts: { audience: "particulier" | "pro" }): string {
  const step = opts.audience === "pro" ? "le rattachement de votre fiche" : "le dépôt de votre projet";
  return `<div style="border-top:1px solid #e7eaec;margin-top:28px;padding-top:22px;font-size:13px;line-height:1.8;color:#66727c">
    Comment avez-vous vécu ${step} ? Positif ou critique, votre retour nous aide.
    <a href="${GOOGLE_REVIEW_URL}" style="color:#a63e18;text-decoration:underline">Partager mon expérience de Workwave sur Google</a>.
  </div>`;
}
