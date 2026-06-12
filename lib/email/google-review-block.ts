/**
 * Bloc "Laissez un avis Google" réutilisable dans les emails transactionnels.
 *
 * Lien officiel de la fiche Google Business "Workwave" (3 Rue des Rosiers,
 * 86110 Craon, fiche validée — récupéré depuis business.google.com le
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
  const question =
    opts.audience === "pro"
      ? "Comment s'est passée la réclamation de votre fiche&nbsp;?"
      : "Comment s'est passé votre dépôt de projet&nbsp;?";
  return `
      <!-- Avis Google -->
      <div style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center;">
        <p style="margin:0 0 6px;font-size:15px;color:#0A0A0A;font-weight:600;">${question}</p>
        <p style="margin:0 0 14px;font-size:13px;color:#6B7280;line-height:1.6;">
          Votre avis compte vraiment&nbsp;: il aide d'autres personnes à découvrir Workwave. Ça prend 30&nbsp;secondes.
        </p>
        <a href="${GOOGLE_REVIEW_URL}"
           style="display:inline-block;background:#FFFFFF;border:1px solid #D1D5DB;color:#0A0A0A;text-decoration:none;padding:10px 22px;border-radius:9999px;font-size:14px;font-weight:600;">
          ★ Laisser un avis sur Google
        </a>
      </div>`;
}
