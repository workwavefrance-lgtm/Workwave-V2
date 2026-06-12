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
  // ⚠️ Cadrage volontaire (décision Willy 12/06) : l'avis porte sur l'EXPÉRIENCE
  // DE L'ÉTAPE qui vient d'être vécue (formulaire, simplicité, rapidité) — PAS
  // sur « avez-vous trouvé un pro » : la couverture pro par zone est encore en
  // construction, un avis basé sur le résultat serait injustement négatif.
  const question =
    opts.audience === "pro"
      ? "La réclamation de votre fiche s'est bien passée&nbsp;?"
      : "Le dépôt de votre projet s'est bien passé&nbsp;?";
  const steer =
    opts.audience === "pro"
      ? "Dites en 30&nbsp;secondes ce que vous avez pensé de cette étape&nbsp;: la vérification, la simplicité, la rapidité. Votre avis aide d'autres artisans à franchir le pas."
      : "Dites en 30&nbsp;secondes ce que vous avez pensé de cette étape&nbsp;: le formulaire, la simplicité, la rapidité. Votre avis aide d'autres particuliers à se lancer.";
  return `
      <!-- Avis Google -->
      <div style="background:#FFF5F2;border:1px solid #FFD4C7;border-radius:12px;padding:22px 20px;margin:0 0 24px;text-align:center;">
        <p style="margin:0 0 8px;font-size:18px;letter-spacing:3px;color:#FF5A36;">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
        <p style="margin:0 0 6px;font-size:15px;color:#0A0A0A;font-weight:600;">${question}</p>
        <p style="margin:0 0 16px;font-size:13px;color:#6B7280;line-height:1.6;">
          ${steer}
        </p>
        <a href="${GOOGLE_REVIEW_URL}"
           style="display:inline-block;background:#FF5A36;color:#FFFFFF;text-decoration:none;padding:12px 26px;border-radius:9999px;font-size:14px;font-weight:600;">
          Donner mon avis sur Google
        </a>
      </div>`;
}
