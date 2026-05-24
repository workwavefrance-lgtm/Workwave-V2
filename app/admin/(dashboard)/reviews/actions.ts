"use server";

import { revalidatePath } from "next/cache";
import { getAdminServiceClient } from "@/lib/admin/service-client";

/**
 * Server Actions de moderation des avis Workwave.
 *
 * publishReview : passe une review de 'pending' → 'published'.
 *   Recalculee via le trigger SQL (recompute_pro_reviews_stats).
 * rejectReview : passe une review de 'pending' → 'rejected'.
 *   N'apparait plus jamais sur la fiche pro.
 */
export async function publishReview(reviewId: number): Promise<{ ok: boolean; error?: string }> {
  const sb = getAdminServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb.from("pro_reviews") as any)
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("status", "pending");
  if (error) {
    console.error("[admin/reviews] publishReview erreur :", error.message);
    return { ok: false, error: error.message };
  }
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function rejectReview(reviewId: number): Promise<{ ok: boolean; error?: string }> {
  const sb = getAdminServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb.from("pro_reviews") as any)
    .update({
      status: "rejected",
    })
    .eq("id", reviewId)
    .eq("status", "pending");
  if (error) {
    console.error("[admin/reviews] rejectReview erreur :", error.message);
    return { ok: false, error: error.message };
  }
  revalidatePath("/admin/reviews");
  return { ok: true };
}
