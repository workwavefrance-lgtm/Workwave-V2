"use server";

import { submitReview } from "@/lib/queries/reviews";

/**
 * Server Action pour le formulaire de notation /avis/[token].
 * Pas de revalidatePath ici : la page server lit le statut a l'init.
 */
export async function submitReviewAction(
  token: string,
  rating: number,
  comment: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!token || typeof token !== "string") {
    return { ok: false, error: "Lien invalide." };
  }
  return submitReview({
    token,
    rating,
    comment: comment?.trim().slice(0, 2000) || null,
  });
}
