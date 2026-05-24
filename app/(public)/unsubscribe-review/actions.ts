"use server";

import { getAdminServiceClient } from "@/lib/admin/service-client";
import { verifyReviewUnsubscribeToken } from "@/lib/utils/review-unsubscribe-token";

/**
 * Server Action pour la page /unsubscribe-review.
 *
 * Verifie le token HMAC + insert dans review_unsubscribes (idempotent
 * grace au ON CONFLICT (email)).
 */
export async function processReviewUnsubscribe(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  if (!email || !token) {
    return { success: false, error: "Lien invalide ou incomplet." };
  }

  const valid = verifyReviewUnsubscribeToken(email, token);
  if (!valid) {
    return { success: false, error: "Lien invalide ou expiré." };
  }

  const sb = getAdminServiceClient();
  // Upsert (idempotent) : si l'email existe deja, on ne fait rien
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb.from("review_unsubscribes") as any)
    .upsert(
      {
        email: email.toLowerCase().trim(),
        source: "email_link",
      },
      { onConflict: "email", ignoreDuplicates: true }
    );

  if (error) {
    console.error("[unsubscribe-review] Erreur upsert :", error.message);
    return {
      success: false,
      error: "Erreur lors de la désinscription. Réessayez ou écrivez-nous à contact@workwave.fr.",
    };
  }

  return { success: true };
}
