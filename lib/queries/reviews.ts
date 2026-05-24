/**
 * Helpers query pour le systeme d'avis natifs Workwave.
 *
 * Architecture :
 * - createReviewRequest() : appele par le cron J+7 ou Server Action.
 *   Genere un token unique + INSERT en status='pending' SANS rating
 *   (le rating sera ajoute quand le particulier soumet via /avis/[token]).
 * - submitReview() : appele depuis la page /avis/[token] quand le
 *   particulier soumet sa note. Passe en 'pending' (modere par admin
 *   si < 3 etoiles) ou directement en 'published' (>= 3 etoiles).
 * - getReviewByToken() : pour la page /avis/[token] — verifie validite.
 * - getPublishedReviewsForPro() : pour la fiche pro et listings.
 *
 * Anonymisation : on affiche prenom + 1ere lettre du nom ("Marie B.").
 * L'email reste interne (audit RGPD, jamais public).
 */
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { sendReviewThanks } from "@/lib/email/send-review-thanks";
import { sendReviewModerationAlert } from "@/lib/email/send-review-moderation-alert";
import type { ProReview } from "@/lib/types/database";

/**
 * Token unique pour /avis/[token]. Cryptographiquement secure, 32 chars
 * url-safe (base64url tronque). Pas de PII dedans.
 */
export function generateReviewToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Cree une demande d'avis : INSERT row en 'pending', genere le token.
 * Appele par le cron J+7 (apres dépôt projet) OU une Server Action
 * manuelle. Retourne le token pour construire l'URL d'invitation.
 */
export async function createReviewRequest(params: {
  proId: number;
  projectId: number | null;
  particulierEmail: string;
  particulierName: string;
  verified?: boolean;
}): Promise<{ token: string; reviewId: number } | null> {
  const sb = getAdminServiceClient();
  const token = generateReviewToken();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("pro_reviews") as any)
    .insert({
      pro_id: params.proId,
      project_id: params.projectId,
      particulier_email: params.particulierEmail,
      particulier_name: params.particulierName,
      // Rating temporaire 0 ne marche pas (CHECK >= 1). On stocke en
      // pending avec rating placeholder qui sera ecrase au submit.
      // Astuce : on initialise a 1 et on filtrera par status='published'
      // pour ne JAMAIS afficher les pending. Le submitReview() ecrasera.
      rating: 1,
      comment: null,
      token,
      status: "pending",
      verified: params.verified ?? true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[reviews] createReviewRequest erreur :", error.message);
    return null;
  }
  return { token, reviewId: (data as { id: number }).id };
}

/**
 * Recupere une review par son token, pour la page /avis/[token].
 * Verifie :
 *   - token existe
 *   - status === 'pending' (sinon deja soumis ou expire)
 * Retourne null si invalide → la page affiche "Lien invalide".
 */
export async function getReviewByToken(
  token: string
): Promise<(ProReview & { pro_name: string; pro_slug: string }) | null> {
  const sb = getAdminServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (sb.from("pro_reviews") as any)
    .select("*, pro:pros(name, slug)")
    .eq("token", token)
    .single();
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const review = data as any;
  return {
    ...review,
    pro_name: review.pro?.name ?? "",
    pro_slug: review.pro?.slug ?? "",
  };
}

/**
 * Soumet l'avis : passe le row de 'pending' → 'published' (auto-publie si
 * rating >= 3) ou 'pending' (modere si < 3, c'est-a-dire les avis
 * potentiellement negatifs).
 *
 * Side-effects (fire-and-forget, non-bloquants) :
 *   - Mail de remerciement au particulier (variant publie/en moderation)
 *   - Alerte admin si rating < 3 (pour moderation rapide)
 */
export async function submitReview(params: {
  token: string;
  rating: number;
  comment: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (params.rating < 1 || params.rating > 5) {
    return { ok: false, error: "Note invalide (1-5)." };
  }

  const sb = getAdminServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (sb.from("pro_reviews") as any)
    .select(
      "id, status, particulier_email, particulier_name, pro:pros(name, slug)"
    )
    .eq("token", params.token)
    .single();
  if (!existing) {
    return { ok: false, error: "Lien invalide ou expiré." };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = existing as any;
  if (e.status === "published") {
    return { ok: false, error: "Avis déjà publié." };
  }
  if (e.status === "rejected" || e.status === "expired") {
    return { ok: false, error: "Lien invalide ou expiré." };
  }

  // Auto-publication si rating >= 3 (filtres positifs), sinon modere
  const newStatus = params.rating >= 3 ? "published" : "pending";
  const now = new Date().toISOString();
  const cleanComment = params.comment?.trim() || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb.from("pro_reviews") as any)
    .update({
      rating: params.rating,
      comment: cleanComment,
      status: newStatus,
      submitted_at: now,
      published_at: newStatus === "published" ? now : null,
    })
    .eq("token", params.token);

  if (error) {
    console.error("[reviews] submitReview erreur :", error.message);
    return { ok: false, error: "Erreur lors de l'enregistrement." };
  }

  // ─── Side-effects : awaited pour garantir l'envoi avant fin function ─
  // IMPORTANT : pas de "fire-and-forget" via .then() sans await dans une
  // Server Action — Vercel ferme la function des que la response part vers
  // le client et tue les promises detachees. Bug observe le 24/05/2026 :
  // les mails n'arrivaient jamais. Solution : await direct (latence +2-3s
  // mais fiable). Le user voit "Envoi en cours..." puis "Merci !" — l'attente
  // est invisible UX-wise.
  const proName = e.pro?.name ?? "l'artisan";
  const proSlug = e.pro?.slug ?? "";

  // 1. Remerciement au particulier (toujours envoye)
  try {
    await sendReviewThanks({
      particulierEmail: e.particulier_email,
      particulierName: e.particulier_name,
      proName,
      proSlug,
      rating: params.rating,
      published: newStatus === "published",
    });
  } catch (err) {
    console.error(
      "[reviews] send thanks failed :",
      err instanceof Error ? err.message : err
    );
  }

  // 2. Alerte admin uniquement pour les avis a moderer (< 3 etoiles)
  if (newStatus === "pending") {
    try {
      await sendReviewModerationAlert({
        proName,
        proSlug,
        particulierName: e.particulier_name,
        rating: params.rating,
        comment: cleanComment,
      });
    } catch (err) {
      console.error(
        "[reviews] send moderation alert failed :",
        err instanceof Error ? err.message : err
      );
    }
  }

  return { ok: true };
}

/**
 * Liste des avis publies pour une fiche pro. Tries DESC par date.
 * Limite a 20 par defaut (afficher les + recents en haut, +bouton voir
 * plus si besoin). Lecture publique (RLS autorise SELECT WHERE status =
 * 'published').
 */
export async function getPublishedReviewsForPro(
  proId: number,
  limit = 20
): Promise<ProReview[]> {
  const sb = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (sb.from("pro_reviews") as any)
    .select("*")
    .eq("pro_id", proId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data as ProReview[] | null) ?? [];
}

/**
 * Liste des avis pending pour la moderation admin.
 */
export async function getPendingReviews(limit = 50): Promise<ProReview[]> {
  const sb = getAdminServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (sb.from("pro_reviews") as any)
    .select("*, pro:pros(id, name, slug)")
    .eq("status", "pending")
    .not("submitted_at", "is", null) // seuls les vraiment soumis (pas les pending qui attendent une soumission)
    .order("submitted_at", { ascending: false })
    .limit(limit);
  return (data as ProReview[] | null) ?? [];
}

/**
 * Helper d'anonymisation pour affichage public : "Marie B." depuis
 * "Marie Berthier". Si pas d'espace dans le nom, on prend juste le nom
 * complet (cas rare).
 */
export function anonymizeReviewerName(fullName: string): string {
  if (!fullName) return "Anonyme";
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}
