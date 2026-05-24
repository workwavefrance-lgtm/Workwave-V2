"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { publishReview, rejectReview } from "./actions";

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

export default function ReviewModerationClient({
  reviews,
}: {
  reviews: ReviewRow[];
}) {
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function handlePublish(id: number) {
    setPendingId(id);
    startTransition(async () => {
      await publishReview(id);
      setPendingId(null);
    });
  }

  function handleReject(id: number) {
    if (
      !confirm(
        "Rejeter cet avis ? Il ne pourra plus être publié et n'apparaîtra jamais sur la fiche pro."
      )
    ) {
      return;
    }
    setPendingId(id);
    startTransition(async () => {
      await rejectReview(id);
      setPendingId(null);
    });
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--text-secondary)]">
          Aucun avis en attente de modération.
        </p>
        <p className="text-[12px] text-[var(--text-tertiary)] mt-2">
          Les avis ≥ 3 étoiles sont publiés automatiquement. Seuls les avis &lt; 3 étoiles passent ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => {
        const submittedDate = r.submitted_at
          ? new Date(r.submitted_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—";
        const isProcessing = pendingId === r.id;

        return (
          <article
            key={r.id}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 sm:p-6"
          >
            {/* Header : pro + meta */}
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div className="min-w-0">
                <Link
                  href={`/artisan/${r.pro_slug}`}
                  target="_blank"
                  className="font-semibold text-[15px] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                >
                  {r.pro_name}
                </Link>
                <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                  Avis soumis par <strong className="text-[var(--text-secondary)]">{r.particulier_name}</strong> ({r.particulier_email}) · {submittedDate}
                </p>
              </div>
              {r.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#16A34A] bg-[#DCFCE7] px-2 py-1 rounded-full shrink-0">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Vérifié (projet routé)
                </span>
              )}
            </div>

            {/* Notation */}
            <div className="flex items-center gap-3 mb-4">
              <Stars value={r.rating} />
              <span
                className="text-[14px] font-medium"
                style={{
                  color: r.rating <= 2 ? "#DC2626" : r.rating === 3 ? "#D97706" : "#16A34A",
                }}
              >
                {r.rating}/5
              </span>
            </div>

            {/* Commentaire */}
            {r.comment ? (
              <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-xl p-4 mb-4">
                <p className="text-[14px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                  {r.comment}
                </p>
              </div>
            ) : (
              <p className="text-[13px] text-[var(--text-tertiary)] italic mb-4">
                (Aucun commentaire — note uniquement)
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handlePublish(r.id)}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 text-white text-[13px] font-semibold transition-all duration-150"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Publier
              </button>
              <button
                onClick={() => handleReject(r.id)}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white dark:bg-[#1A1A1A] border border-[#DC2626] hover:bg-[#FEF2F2] disabled:opacity-50 text-[#DC2626] text-[13px] font-semibold transition-all duration-150"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                Rejeter
              </button>
              {isProcessing && (
                <span className="text-[12px] text-[var(--text-tertiary)] ml-2">
                  Traitement…
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} étoiles sur 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={value >= star ? "#FF5A36" : "none"}
          stroke="#FF5A36"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}
