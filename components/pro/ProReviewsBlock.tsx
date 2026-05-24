import type { ProReview } from "@/lib/types/database";
import { anonymizeReviewerName } from "@/lib/queries/reviews";

/**
 * Bloc d'avis natifs Workwave sur la fiche pro /artisan/[slug].
 *
 * Affiche :
 * - Note moyenne en gros (Workwave + Google si dispo)
 * - Repartition des notes
 * - Liste des avis publies (anonymises)
 *
 * Pas de pagination ici : on limite a 20 avis recents au fetch.
 * Si plus tard on a besoin de "voir plus", on ajoutera un toggle.
 *
 * Design : coherent fiche pro (cards bg-secondary, h2 tertiary
 * uppercase, espacement standard).
 */
export default function ProReviewsBlock({
  reviews,
  workwaveAvg,
  workwaveCount,
  googleRating,
  googleReviewsCount,
}: {
  reviews: ProReview[];
  workwaveAvg: number | null;
  workwaveCount: number;
  googleRating: number | null;
  googleReviewsCount: number | null;
}) {
  // Pas d'affichage si aucune source d'avis disponible
  const hasWorkwave = workwaveCount > 0 && workwaveAvg !== null;
  const hasGoogle = googleRating !== null && googleReviewsCount && googleReviewsCount > 0;
  if (!hasWorkwave && !hasGoogle) return null;

  return (
    <div className="mt-16 pt-8 border-t border-[var(--border-color)]">
      <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
        Avis clients
      </h2>

      {/* En-tete : notes agregees (Workwave + Google) */}
      <section className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Note Workwave */}
          {hasWorkwave ? (
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                Avis vérifiés Workwave
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                  {workwaveAvg!.toFixed(1)}
                </span>
                <Stars value={workwaveAvg!} size={18} />
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                {workwaveCount} avis client{workwaveCount > 1 ? "s" : ""} vérifié{workwaveCount > 1 ? "s" : ""}
              </p>
            </div>
          ) : (
            <div className="opacity-60">
              <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                Avis Workwave
              </p>
              <p className="text-[14px] text-[var(--text-tertiary)] italic">
                Aucun avis Workwave pour le moment.
              </p>
            </div>
          )}

          {/* Note Google */}
          {hasGoogle && (
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                Avis Google
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                  {googleRating!.toFixed(1)}
                </span>
                <Stars value={googleRating!} size={18} />
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                {googleReviewsCount} avis Google
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Liste des avis Workwave publies */}
      {hasWorkwave && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Note explicative en bas */}
      <p className="text-[12px] text-[var(--text-tertiary)] mt-6 leading-relaxed max-w-2xl">
        Les avis Workwave sont collectés automatiquement auprès des particuliers ayant été mis en relation avec l&apos;artisan via notre plateforme. Chaque avis est vérifié par notre équipe avant publication.
      </p>
    </div>
  );
}

/**
 * 5 etoiles SVG, partiellement remplies selon la valeur 0-5.
 */
function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${value.toFixed(1)} étoiles sur 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill =
          value >= star
            ? "#FF5A36"
            : value >= star - 0.5
              ? "url(#half-fill)"
              : "none";
        return (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            stroke="#FF5A36"
            strokeWidth="1.5"
            fill={fill}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="half-fill">
                <stop offset="50%" stopColor="#FF5A36" />
                <stop offset="50%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
    </span>
  );
}

/**
 * Card individuelle pour un avis Workwave publie.
 */
function ReviewItem({ review }: { review: ProReview }) {
  const reviewer = anonymizeReviewerName(review.particulier_name);
  const initial = reviewer.charAt(0).toUpperCase();
  const dateStr = review.published_at
    ? new Date(review.published_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <article className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar avec initiale */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--accent-muted)" }}
        >
          <span className="text-[var(--accent)] font-semibold text-sm">
            {initial}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[14px] text-[var(--text-primary)]">
              {reviewer}
            </p>
            {review.verified && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium text-[#16A34A] bg-[#DCFCE7] px-1.5 py-0.5 rounded-full"
                title="Cet avis provient d'une mise en relation vérifiée via Workwave"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Vérifié
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Stars value={review.rating} size={14} />
            <span className="text-[12px] text-[var(--text-tertiary)]">
              {dateStr}
            </span>
          </div>
        </div>
      </div>

      {review.comment && (
        <p className="text-[14px] text-[var(--text-primary)] leading-relaxed pl-13 sm:ml-13" style={{ marginLeft: "52px" }}>
          {review.comment}
        </p>
      )}
    </article>
  );
}
