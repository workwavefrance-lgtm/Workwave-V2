import { getAdminServiceClient } from "@/lib/admin/service-client";
import ReviewModerationClient from "./ReviewModerationClient";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: number;
  pro_id: number;
  pro_name: string;
  pro_slug: string;
  particulier_name: string;
  particulier_email: string;
  rating: number;
  comment: string | null;
  verified: boolean;
  submitted_at: string | null;
  status: string;
};

/**
 * Page de moderation des avis Workwave.
 *
 * Liste les avis pending QUI ONT ETE SOUMIS (submitted_at IS NOT NULL).
 * Les pending sans submitted_at sont des reviews creees par cron mais
 * pas encore soumises par le particulier — pas a moderer.
 *
 * Auto-publication : les avis >= 3 etoiles sont publies directement
 * sans passer ici (cf. lib/queries/reviews.ts submitReview).
 *
 * → Ici n'apparaissent que les avis < 3 etoiles, qui peuvent etre :
 *   - Legitimes (publication recommandee pour la transparence)
 *   - Diffamatoires / faux (a rejeter)
 *   - Constructifs mais durs (publication apres lecture)
 */
export default async function AdminReviewsPage() {
  const sb = getAdminServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (sb.from("pro_reviews") as any)
    .select(
      "id, pro_id, particulier_name, particulier_email, rating, comment, verified, submitted_at, status, pro:pros(name, slug)"
    )
    .eq("status", "pending")
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews: ReviewRow[] = ((data as any[]) ?? []).map((r) => ({
    id: r.id,
    pro_id: r.pro_id,
    pro_name: r.pro?.name ?? "Inconnu",
    pro_slug: r.pro?.slug ?? "",
    particulier_name: r.particulier_name,
    particulier_email: r.particulier_email,
    rating: r.rating,
    comment: r.comment,
    verified: r.verified,
    submitted_at: r.submitted_at,
    status: r.status,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Modération des avis
        </h1>
        <p className="text-[14px] text-[var(--text-secondary)] mt-2 max-w-2xl">
          Les avis Workwave avec une note &lt; 3 étoiles passent en modération avant publication.
          Les avis ≥ 3 étoiles sont publiés automatiquement sur la fiche pro.
        </p>
        <div className="flex items-center gap-3 mt-3 text-[12px] text-[var(--text-tertiary)]">
          <span>
            <strong className="text-[var(--text-primary)]">{reviews.length}</strong> avis en attente
          </span>
          {reviews.length > 0 && (
            <>
              <span>·</span>
              <span>
                Note moyenne : <strong className="text-[var(--text-primary)]">
                  {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}/5
                </strong>
              </span>
            </>
          )}
        </div>
      </div>

      <ReviewModerationClient reviews={reviews} />
    </div>
  );
}
